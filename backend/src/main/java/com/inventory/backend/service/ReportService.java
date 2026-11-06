package com.inventory.backend.service;

import com.inventory.backend.entity.*;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.repository.SaleRepository;
import com.inventory.backend.repository.StockRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class ReportService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;

    public ReportService(SaleRepository saleRepository,
                         ProductRepository productRepository,
                         StockRepository stockRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
    }

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static class Acc {
        int sales;
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal cost = BigDecimal.ZERO;
        BigDecimal profit = BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public byte[] gananciasExcel(String period, LocalDate from, LocalDate to) {
        if (!List.of("day", "week", "month").contains(period)) {
            throw new IllegalArgumentException("El período debe ser day, week o month");
        }
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("La fecha final no puede ser anterior a la inicial");
        }

        List<Sale> sales = saleRepository.search(null, from.atStartOfDay(), to.plusDays(1).atStartOfDay())
                .stream().filter(s -> s.getStatus() == SaleStatus.COMPLETADA).toList();

        // Resumen agrupado (TreeMap = ordenado por fecha de inicio del período)
        Map<LocalDate, Acc> grupos = new TreeMap<>();
        for (Sale s : sales) {
            LocalDate d = s.getCreatedAt().toLocalDate();
            LocalDate key = switch (period) {
                case "week" -> d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                case "month" -> d.withDayOfMonth(1);
                default -> d;
            };
            Acc a = grupos.computeIfAbsent(key, k -> new Acc());
            a.sales++;
            a.total = a.total.add(s.getTotal());
            for (SaleItem i : s.getItems()) {
                BigDecimal q = BigDecimal.valueOf(i.getQuantity());
                BigDecimal list = i.getListPrice() != null ? i.getListPrice() : i.getUnitPrice();
                a.discount = a.discount.add(list.subtract(i.getUnitPrice()).max(BigDecimal.ZERO).multiply(q));
                if (i.getCost() != null) {
                    a.cost = a.cost.add(i.getCost().multiply(q));
                    a.profit = a.profit.add(i.getUnitPrice().subtract(i.getCost()).multiply(q));
                }
            }
        }

        try (Workbook wb = new XSSFWorkbook()) {
            Styles st = new Styles(wb);

            // ---- Hoja 1: resumen ----
            Sheet r = wb.createSheet("Resumen");
            String[] h1 = {"Período", "Ventas", "Total vendido", "Rebajas", "Costo", "Ganancia"};
            header(r, st, h1);
            int row = 1;
            Acc tot = new Acc();
            for (var e : grupos.entrySet()) {
                Acc a = e.getValue();
                Row x = r.createRow(row++);
                x.createCell(0).setCellValue(label(period, e.getKey()));
                x.createCell(1).setCellValue(a.sales);
                money(x, 2, a.total, st); money(x, 3, a.discount, st);
                money(x, 4, a.cost, st);  money(x, 5, a.profit, st);
                tot.sales += a.sales; tot.total = tot.total.add(a.total);
                tot.discount = tot.discount.add(a.discount);
                tot.cost = tot.cost.add(a.cost); tot.profit = tot.profit.add(a.profit);
            }
            Row t = r.createRow(row);
            Cell tc = t.createCell(0); tc.setCellValue("TOTAL"); tc.setCellStyle(st.bold);
            Cell ts = t.createCell(1); ts.setCellValue(tot.sales); ts.setCellStyle(st.bold);
            moneyBold(t, 2, tot.total, st); moneyBold(t, 3, tot.discount, st);
            moneyBold(t, 4, tot.cost, st);  moneyBold(t, 5, tot.profit, st);
            for (int c = 0; c < h1.length; c++) r.autoSizeColumn(c);

            // ---- Hoja 2: detalle ----
            Sheet d = wb.createSheet("Detalle");
            String[] h2 = {"Venta", "Fecha", "Vendedor", "Cliente", "Pago", "Código", "Producto",
                    "Presentación", "Cantidad", "Precio lista", "Precio cobrado", "Rebaja/unid",
                    "Costo/unid", "Subtotal", "Ganancia", "Motivo rebaja"};
            header(d, st, h2);
            int dr = 1;
            for (Sale s : sales) {
                for (SaleItem i : s.getItems()) {
                    Row x = d.createRow(dr++);
                    BigDecimal q = BigDecimal.valueOf(i.getQuantity());
                    BigDecimal list = i.getListPrice() != null ? i.getListPrice() : i.getUnitPrice();
                    x.createCell(0).setCellValue(s.getId());
                    x.createCell(1).setCellValue(s.getCreatedAt().format(DT));
                    x.createCell(2).setCellValue(s.getSoldBy());
                    x.createCell(3).setCellValue(s.getCustomerName() == null ? "" : s.getCustomerName());
                    x.createCell(4).setCellValue(s.getPaymentMethod().name());
                    x.createCell(5).setCellValue(i.getProduct().getCode());
                    x.createCell(6).setCellValue(i.getProduct().getName());
                    x.createCell(7).setCellValue(i.getFraction() == null ? "Entero" : i.getFraction().getLabel());
                    x.createCell(8).setCellValue(i.getQuantity());
                    money(x, 9, list, st);
                    money(x, 10, i.getUnitPrice(), st);
                    money(x, 11, list.subtract(i.getUnitPrice()).max(BigDecimal.ZERO), st);
                    if (i.getCost() != null) {
                        money(x, 12, i.getCost(), st);
                        money(x, 14, i.getUnitPrice().subtract(i.getCost()).multiply(q), st);
                    }
                    money(x, 13, i.getSubtotal(), st);
                    x.createCell(15).setCellValue(i.getDiscountReason() == null ? "" : i.getDiscountReason());
                }
            }
            for (int c = 0; c < h2.length; c++) d.autoSizeColumn(c);
            d.createFreezePane(0, 1);

            return toBytes(wb);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el Excel", e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] productosExcel(boolean admin) {
        Map<Long, Integer> stock = new HashMap<>();
        stockRepository.findAll().forEach(s -> stock.put(s.getProduct().getId(), s.getQuantity()));
        Map<Long, Integer> minimo = new HashMap<>();
        stockRepository.findAll().forEach(s -> minimo.put(s.getProduct().getId(), s.getMinimumStock()));

        try (Workbook wb = new XSSFWorkbook()) {
            Styles st = new Styles(wb);
            Sheet sh = wb.createSheet("Productos");

            List<String> cols = new ArrayList<>(List.of("Código", "Nombre", "Código de barras",
                    "Precio lista", "Precio mínimo", "Stock", "Stock mínimo", "Estado", "Fraccionable"));
            if (admin) { cols.add("Costo"); cols.add("Ganancia/unid"); cols.add("Margen %"); }
            header(sh, st, cols.toArray(new String[0]));

            int row = 1;
            for (Product p : productRepository.findAll()) {
                Row x = sh.createRow(row++);
                x.createCell(0).setCellValue(p.getCode());
                x.createCell(1).setCellValue(p.getName());
                x.createCell(2).setCellValue(p.getBarcode() == null ? "" : p.getBarcode());
                money(x, 3, p.getPrice(), st);
                if (p.getMinPrice() != null) money(x, 4, p.getMinPrice(), st);
                x.createCell(5).setCellValue(stock.getOrDefault(p.getId(), 0));
                x.createCell(6).setCellValue(minimo.getOrDefault(p.getId(), 5));
                x.createCell(7).setCellValue(p.getActive() ? "Activo" : "Inactivo");
                x.createCell(8).setCellValue(Boolean.TRUE.equals(p.getFractionable()) ? "Sí" : "No");
                if (admin && p.getCost() != null) {
                    BigDecimal profit = p.getPrice().subtract(p.getCost());
                    money(x, 9, p.getCost(), st);
                    money(x, 10, profit, st);
                    x.createCell(11).setCellValue(profit.multiply(BigDecimal.valueOf(100))
                            .divide(p.getCost(), 2, java.math.RoundingMode.HALF_UP).doubleValue());
                }
            }
            for (int c = 0; c < cols.size(); c++) sh.autoSizeColumn(c);
            sh.createFreezePane(0, 1);
            sh.setAutoFilter(new CellRangeAddress(0, Math.max(row - 1, 0), 0, cols.size() - 1));

            return toBytes(wb);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el Excel", e);
        }
    }

    // ---------- utilidades ----------
    private static String label(String period, LocalDate k) {
        return switch (period) {
            case "week" -> "Semana del " + k.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            case "month" -> k.format(DateTimeFormatter.ofPattern("MM/yyyy"));
            default -> k.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        };
    }

    private static class Styles {
        final CellStyle head, money, bold, moneyBold;
        Styles(Workbook wb) {
            Font bf = wb.createFont(); bf.setBold(true);
            bold = wb.createCellStyle(); bold.setFont(bf);
            head = wb.createCellStyle(); head.setFont(bf);
            head.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            head.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            DataFormat df = wb.createDataFormat();
            money = wb.createCellStyle(); money.setDataFormat(df.getFormat("#,##0.00"));
            moneyBold = wb.createCellStyle(); moneyBold.setDataFormat(df.getFormat("#,##0.00"));
            moneyBold.setFont(bf);
        }
    }

    private static void header(Sheet sh, Styles st, String[] cols) {
        Row r = sh.createRow(0);
        for (int i = 0; i < cols.length; i++) {
            Cell c = r.createCell(i); c.setCellValue(cols[i]); c.setCellStyle(st.head);
        }
    }

    private static void money(Row r, int col, BigDecimal v, Styles st) {
        Cell c = r.createCell(col); c.setCellValue(v.doubleValue()); c.setCellStyle(st.money);
    }

    private static void moneyBold(Row r, int col, BigDecimal v, Styles st) {
        Cell c = r.createCell(col); c.setCellValue(v.doubleValue()); c.setCellStyle(st.moneyBold);
    }

    private static byte[] toBytes(Workbook wb) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        wb.write(out);
        return out.toByteArray();
    }
}