package com.inventory.backend.service;

import com.inventory.backend.dto.ImportResult;
import com.inventory.backend.dto.ImportRowError;
import com.inventory.backend.entity.Product;
import com.inventory.backend.repository.ProductRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class ProductImportService {

    private static final int MAX_ROWS = 2000;
    private static final String[] HEADERS = {
            "codigo", "nombre", "descripcion", "codigo_barras",
            "costo", "precio", "precio_minimo", "stock_inicial"};

    private final ProductRepository productRepository;
    private final StockService stockService;

    public ProductImportService(ProductRepository productRepository, StockService stockService) {
        this.productRepository = productRepository;
        this.stockService = stockService;
    }

    public byte[] plantilla() {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sh = wb.createSheet("Productos");
            Row h = sh.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) h.createCell(i).setCellValue(HEADERS[i]);
            Row ej = sh.createRow(1);
            ej.createCell(0).setCellValue("PROD-001");
            ej.createCell(1).setCellValue("Cuaderno universitario");
            ej.createCell(2).setCellValue("Cuaderno de 100 hojas");
            ej.createCell(3).setCellValue("7750000000012");
            ej.createCell(4).setCellValue(5.50);
            ej.createCell(5).setCellValue(8.50);
            ej.createCell(6).setCellValue(7.50);
            ej.createCell(7).setCellValue(20);
            for (int i = 0; i < HEADERS.length; i++) sh.autoSizeColumn(i);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar la plantilla", e);
        }
    }

    private record Fila(int numero, String code, String name, String desc, String barcode,
                        BigDecimal cost, BigDecimal price, BigDecimal minPrice, Integer stock) {}

    @Transactional
    public ImportResult importar(MultipartFile file, boolean dryRun) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Sube un archivo Excel (.xlsx)");
        }
        String nombre = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!nombre.endsWith(".xlsx")) {
            throw new IllegalArgumentException("El archivo debe ser .xlsx");
        }

        List<ImportRowError> errores = new ArrayList<>();
        List<Fila> validas = new ArrayList<>();
        Set<String> codigos = new HashSet<>();
        Set<String> barras = new HashSet<>();
        int total = 0;

        try (InputStream in = file.getInputStream(); Workbook wb = new XSSFWorkbook(in)) {
            Sheet sh = wb.getSheetAt(0);
            Map<String, Integer> col = columnas(sh.getRow(0));
            for (String req : new String[]{"codigo", "nombre", "precio"}) {
                if (!col.containsKey(req)) {
                    throw new IllegalArgumentException("Falta la columna \"" + req + "\". Descarga la plantilla.");
                }
            }

            for (int r = 1; r <= sh.getLastRowNum(); r++) {
                Row row = sh.getRow(r);
                if (row == null || vacia(row)) continue;
                total++;
                if (total > MAX_ROWS) {
                    throw new IllegalArgumentException("Máximo " + MAX_ROWS + " filas por archivo");
                }
                int n = r + 1; // número de fila como lo ve el usuario en Excel
                try {
                    String code = texto(row, col, "codigo");
                    String name = texto(row, col, "nombre");
                    BigDecimal price = decimal(row, col, "precio");
                    BigDecimal cost = decimal(row, col, "costo");
                    BigDecimal min = decimal(row, col, "precio_minimo");
                    String barcode = texto(row, col, "codigo_barras");
                    String desc = texto(row, col, "descripcion");
                    BigDecimal stockDec = decimal(row, col, "stock_inicial");

                    if (code == null) throw new IllegalArgumentException("Falta el código");
                    if (code.length() > 50) throw new IllegalArgumentException("El código supera 50 caracteres");
                    if (name == null) throw new IllegalArgumentException("Falta el nombre");
                    if (name.length() > 150) throw new IllegalArgumentException("El nombre supera 150 caracteres");
                    if (price == null || price.signum() <= 0) throw new IllegalArgumentException("El precio debe ser mayor que cero");
                    if (cost != null && cost.signum() <= 0) throw new IllegalArgumentException("El costo debe ser mayor que cero");
                    if (min != null && min.signum() <= 0) throw new IllegalArgumentException("El precio mínimo debe ser mayor que cero");
                    if (min != null && min.compareTo(price) > 0) throw new IllegalArgumentException("El precio mínimo no puede superar el precio");
                    if (desc != null && desc.length() > 500) throw new IllegalArgumentException("La descripción supera 500 caracteres");

                    Integer stock = null;
                    if (stockDec != null) {
                        if (stockDec.signum() < 0 || stockDec.stripTrailingZeros().scale() > 0) {
                            throw new IllegalArgumentException("El stock inicial debe ser un entero mayor o igual a cero");
                        }
                        stock = stockDec.intValue();
                    }

                    if (!codigos.add(code.toLowerCase())) {
                        throw new IllegalArgumentException("El código \"" + code + "\" está repetido en el archivo");
                    }
                    if (productRepository.existsByCode(code)) {
                        throw new IllegalArgumentException("YA EXISTE un producto con el código \"" + code + "\"");
                    }
                    if (barcode != null) {
                        if (!barras.add(barcode)) {
                            throw new IllegalArgumentException("El código de barras \"" + barcode + "\" está repetido en el archivo");
                        }
                        if (productRepository.existsByBarcode(barcode)) {
                            throw new IllegalArgumentException("YA EXISTE un producto con el código de barras \"" + barcode + "\"");
                        }
                    }

                    validas.add(new Fila(n, code, name, desc, barcode, cost, price, min, stock));
                } catch (IllegalArgumentException e) {
                    errores.add(new ImportRowError(n, e.getMessage()));
                }
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("No se pudo leer el archivo; verifica que sea un .xlsx válido");
        }

        if (total == 0) {
            throw new IllegalArgumentException("El archivo no tiene filas de datos");
        }

        // Todo o nada: con errores no se guarda nada
        if (dryRun || !errores.isEmpty()) {
            return new ImportResult(dryRun, total, validas.size(), 0, errores);
        }

        for (Fila f : validas) {
            Product p = new Product();
            p.setCode(f.code());
            p.setName(f.name());
            p.setDescription(f.desc());
            p.setBarcode(f.barcode());
            p.setCost(f.cost());
            p.setPrice(f.price().setScale(2, RoundingMode.HALF_UP));
            p.setMinPrice(f.minPrice());
            p = productRepository.save(p);
            if (f.stock() != null && f.stock() > 0) {
                stockService.registrarEntrada(p.getId(), f.stock());
            }
        }
        return new ImportResult(false, total, validas.size(), validas.size(), errores);
    }

    // ---------- utilidades ----------
    private static Map<String, Integer> columnas(Row header) {
        if (header == null) throw new IllegalArgumentException("El archivo no tiene encabezados. Descarga la plantilla.");
        Map<String, Integer> m = new HashMap<>();
        for (Cell c : header) {
            String t = c.toString().trim().toLowerCase()
                    .replace("ó", "o").replace("á", "a").replace("é", "e")
                    .replace("í", "i").replace("ú", "u").replace(" ", "_");
            m.put(t, c.getColumnIndex());
        }
        return m;
    }

    private static boolean vacia(Row row) {
        for (Cell c : row) {
            if (c.getCellType() != CellType.BLANK && !c.toString().isBlank()) return false;
        }
        return true;
    }

    private static String texto(Row row, Map<String, Integer> col, String nombre) {
        Integer i = col.get(nombre);
        if (i == null) return null;
        Cell c = row.getCell(i);
        if (c == null) return null;
        String s;
        if (c.getCellType() == CellType.NUMERIC) {
            // Evita "7750000000012.0" y notación científica en códigos de barras
            s = new BigDecimal(c.getNumericCellValue()).toPlainString();
            if (s.contains(".")) s = s.replaceAll("0+$", "").replaceAll("\\.$", "");
        } else {
            s = c.toString();
        }
        s = s.trim();
        return s.isEmpty() ? null : s;
    }

    private static BigDecimal decimal(Row row, Map<String, Integer> col, String nombre) {
        Integer i = col.get(nombre);
        if (i == null) return null;
        Cell c = row.getCell(i);
        if (c == null || c.getCellType() == CellType.BLANK) return null;
        try {
            if (c.getCellType() == CellType.NUMERIC) return BigDecimal.valueOf(c.getNumericCellValue());
            String s = c.toString().trim().replace(",", ".");
            return s.isEmpty() ? null : new BigDecimal(s);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("\"" + nombre + "\" no es un número válido");
        }
    }
}