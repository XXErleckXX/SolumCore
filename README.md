# 🌍 SolumCore

**Plataforma de Inteligencia Geoespacial de Acceso Abierto.**
*Democratizando el acceso a Gemelos Digitales y análisis del terreno de alta resolución.*

🔗 **Demo:** [SolumCoreWeb](https://xxerleckxx.github.io/SolumCore/)

---

## 📖 Descripción del Proyecto

**SolumCore** es una plataforma diseñada para cerrar la brecha entre la imagen satelital convencional y la topografía láser profesional. Funciona como una base de datos dinámica de la realidad física ("Wikipedia de la realidad 3D"), permitiendo la ingesta, visualización y análisis de modelos fotogramétricos de alta fidelidad directamente en el navegador.

El sistema utiliza **3D Tiles** para transmitir gigabytes de geometría compleja sin latencia, permitiendo un nivel de detalle (LOD) dinámico sobre el terreno mundial.

---

## 🚀 Características Principales

*   **Visualización Masiva:** Renderizado optimizado de *Digital Twins* utilizando el estándar OGC 3D Tiles y *hierarchical culling*.
*   **Análisis en Tiempo Real (Shader VARI):** Implementación de shaders personalizados en GLSL para calcular el *Visible Atmospherically Resistant Index* directamente en la GPU del cliente.
    *   *Fórmula:* `(Green - Red) / (Green + Red - Blue)`
    *   *Uso:* Detección de estrés hídrico y salud vegetal sin sensores multiespectrales.
*   **Hardware Agnostic:** Compatible con capturas de cualquier plataforma UAV (DJI, FPV, etc.) capaz de realizar vuelos autónomos con solape >70%.
*   **Georreferenciación Precisa:** Superposición exacta sobre capas base de Bing Maps y Sentinel-2.

---

## 🛠️ Stack Tecnológico

La arquitectura es modular, priorizando estándares abiertos y eficiencia de costes:

| Capa | Tecnología | Función |
| :--- | :--- | :--- |
| **Cliente Web** | **CesiumJS** | Motor de globo virtual 3D y renderizado WebGL. |
| **Procesamiento** | **RealityScan** | Generación de mallas texturizadas a partir de fotogrametría. |
| **Formato** | **.GLB / 3D Tiles** | Exportación con compresión Draco y tiling espacial. |
| **Backend/Hosting** | **Cesium Ion** | Alojamiento y streaming de activos pesados. |
| **Despliegue** | **GitHub Pages** | Hosting del cliente web estático. |

---

## 🖱️ Controles

*   **Click Izquierdo:** Arrastrar mapa (Pan).
*   **Click Derecho:** Zoom in / Zoom out.
*   **Rueda / Click Central:** Rotar e inclinar la cámara (Tilt) para vistas 3D.
*   **Panel UI:** Activa o desactiva capas de análisis (como el filtro VARI) desde la interfaz.

---

## 🔮 Casos de Uso

*   **Patrimonio:** Preservación digital de monumentos históricos.
*   **Agro-Tech:** Monitorización de cultivos y detección temprana de plagas.
*   **Ingeniería Civil:** Control de movimientos de tierra y taludes.

---
