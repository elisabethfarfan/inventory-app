
package com.inventory.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.annotation.PostConstruct;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {


@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<Map<String, String>> manejarAccesoDenegado(AccessDeniedException ex) {
    return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "No tienes permiso para realizar esta acción"));
}
   
@ExceptionHandler(HttpMessageNotReadableException.class)
public ResponseEntity<Map<String, String>> manejarJsonInvalido(
        HttpMessageNotReadableException ex) {

    System.out.println(">>> Se ejecuto manejarJsonInvalido <<<");
    System.out.println("Mensaje: " + ex.getMessage());

    if (ex.getCause() != null) {
        System.out.println("Causa: " + ex.getCause().getMessage());
    }

    return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                    "error",
                    "El cuerpo de la solicitud contiene datos inválidos"
            ));
}

  

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> manejarValidaciones(
            MethodArgumentNotValidException ex) {
System.out.println(">>> Se ejecuto manejarValidaciones <<<");
        String mensaje = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getDefaultMessage())
                .collect(Collectors.joining("; "));

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", mensaje));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> manejarDatosInvalidos(
            IllegalArgumentException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<Map<String, String>> manejarNoEncontrado(ResourceNotFoundException ex) {
    return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", ex.getMessage()));
}

@ExceptionHandler(InvalidCredentialsException.class)
public ResponseEntity<Map<String, String>> manejarCredenciales(InvalidCredentialsException ex) {
    return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", ex.getMessage()));
}
}
