package com.inventory.backend.service;

import com.inventory.backend.dto.ContainerResponse;
import com.inventory.backend.dto.ContainerSummary;
import com.inventory.backend.entity.ContainerStatus;
import com.inventory.backend.entity.OpenContainer;
import com.inventory.backend.entity.Stock;
import com.inventory.backend.repository.OpenContainerRepository;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.repository.StockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ContainerService {

    private final OpenContainerRepository containerRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;

    public ContainerService(OpenContainerRepository containerRepository,
                            ProductRepository productRepository,
                            StockRepository stockRepository) {
        this.containerRepository = containerRepository;
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
    }

    @Transactional(readOnly = true)
    public List<ContainerResponse> listarAbiertos() {
        return containerRepository.findByStatusOrderByOpenedAtAsc(ContainerStatus.ABIERTO)
                .stream().map(ContainerResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ContainerSummary> resumen() {
        Map<Long, List<OpenContainer>> porProducto =
                containerRepository.findByStatusOrderByOpenedAtAsc(ContainerStatus.ABIERTO)
                        .stream()
                        .collect(Collectors.groupingBy(c -> c.getProduct().getId()));

        return productRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getFractionable()))
                .map(p -> {
                    List<OpenContainer> abiertos = porProducto.getOrDefault(p.getId(), List.of());
                    BigDecimal restante = abiertos.stream()
                            .map(OpenContainer::getRemaining)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    int cerrados = stockRepository.findByProductId(p.getId())
                            .map(Stock::getQuantity).orElse(0);
                    return new ContainerSummary(p.getId(), p.getCode(), p.getName(),
                            cerrados, abiertos.size(), restante);
                })
                .toList();
    }
}