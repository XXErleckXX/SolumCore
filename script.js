Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ODg2ZjNiOC0wOGQwLTRkNDktYjA3OS0zODQ0NmE0MmE3NTEiLCJpZCI6MzgxMzQxLCJpYXQiOjE3Njg5Mzc3NjB9.jNxFY01Mofq_1z1aT6Ni-F-x_TfGZh1GMmyU59xs4-w';

const viewer = new Cesium.Viewer('cesiumContainer', {
    terrain: undefined,
    animation: false,
    timeline: false,
    geocoder: true,
    navigationHelpButton: true,
    baseLayerPicker: false,
    homeButton: false,
    sceneModePicker: false
});

viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(-4, 40, 18000000)
});

const modelos = {
    4365574: 'Villalgordo 1',
    4365575: 'Villalgordo 2',
    4365576: 'Minaya',
    4365588: 'Pinares'
};

let tilesetActual = null;



// VARI Filter Implementation
let variEnabled = false;

const variShader = new Cesium.CustomShader({
    fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 color = material.diffuse;
        float red = color.r;
        float green = color.g;
        float blue = color.b;

        // VARI Formula: (Green - Red) / (Green + Red - Blue)
        float denominator = green + red - blue;
        
        // Avoid division by zero
        if (abs(denominator) < 0.0001) {
            return;
        }

        float vari = (green - red) / denominator;

        // Visualizing VARI
        // Typical range is -1 to 1
        // We want a color scale: 
        // High (> 0.2) -> Green (Healthy Vegetation)
        // Mid (0 to 0.2) -> Yellow/Orange
        // Low (< 0) -> Red/Brown (Soil/Non-vegetation)

        vec3 outColor;

        if (vari > 0.1) {
            // Vegetation - Green gradient
            // Normalize 0.1 to 1.0 -> 0.0 to 1.0
            float t = clamp((vari - 0.1) / 0.9, 0.0, 1.0);
            outColor = mix(vec3(0.8, 1.0, 0.0), vec3(0.0, 0.5, 0.0), t); // Yellow-Green to Dark Green
        } else if (vari > -0.1) {
             // Transition - Yellow/Orange
             // Normalize -0.1 to 0.1 -> 0.0 to 1.0
             float t = clamp((vari + 0.1) / 0.2, 0.0, 1.0);
             outColor = mix(vec3(0.8, 0.5, 0.2), vec3(0.8, 1.0, 0.0), t); 
        } else {
             // Non-vegetation - Red/Brown
             // Normalize -1.0 to -0.1 -> 0.0 to 1.0
             float t = clamp((vari + 1.0) / 0.9, 0.0, 1.0);
             outColor = mix(vec3(0.3, 0.1, 0.0), vec3(0.8, 0.5, 0.2), t);
        }

        material.diffuse = outColor;
    }
    `
});

window.toggleVari = () => {
    variEnabled = !variEnabled;
    const btn = document.getElementById('btnVari');

    if (variEnabled) {
        btn.innerHTML = '🍃 VARI Filter: ON';
        btn.classList.add('active');
    } else {
        btn.innerHTML = '🍂 VARI Filter: OFF';
        btn.classList.remove('active');
    }

    if (tilesetActual) {
        tilesetActual.customShader = variEnabled ? variShader : undefined;
    }
};

// Hook into cargarModelo to apply shader if enabled
const originalCargarModelo = window.cargarModelo;
window.cargarModelo = async id => {
    // We already have the logic in the original function, but we need to ensure the shader is applied
    // The easiest way is to let the original run, then set the shader on tilesetActual

    // However, original function replaces tilesetActual. 
    // Let's modify the Original function instead of wrapping it, to be cleaner, 
    // but since I'm in a 'replace_file_content' block, I can just rewrite the function above or below.
    // The block I'm replacing ends at line 47. 
    // I will redefine cargarModelo completely here to include the shader logic.

    try {
        if (tilesetActual) {
            viewer.scene.primitives.remove(tilesetActual);
            tilesetActual = null;
        }

        console.log("Cargando " + modelos[id] + " (ID: " + id + ")...");

        // Load the tileset
        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(id);

        // Apply shader if enabled
        if (variEnabled) {
            tileset.customShader = variShader;
        }

        tilesetActual = viewer.scene.primitives.add(tileset);

        await tilesetActual.readyPromise;

        viewer.zoomTo(tilesetActual);

    } catch (error) {
        console.error('Error cargando modelo:', error);
    }
};

window.irMundo = () => {
    if (tilesetActual) {
        viewer.scene.primitives.remove(tilesetActual);
        tilesetActual = null;
    }

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-4, 40, 18000000),
        duration: 2
    });
};