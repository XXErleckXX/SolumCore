Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ODg2ZjNiOC0wOGQwLTRkNDktYjA3OS0zODQ0NmE0MmE3NTEiLCJpZCI6MzgxMzQxLCJpYXQiOjE3Njg5Mzc3NjB9.jNxFY01Mofq_1z1aT6Ni-F-x_TfGZh1GMmyU59xs4-w';

const MODEL_HEIGHT_OFFSET = -680;

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

let variEnabled = false;
let waterEnabled = false;

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
             // Transition - Yellow/Orange / Red-Orange
             // Normalize -0.1 to 0.1 -> 0.0 to 1.0
             float t = clamp((vari + 0.1) / 0.2, 0.0, 1.0);
             outColor = mix(vec3(0.9, 0.2, 0.0), vec3(0.8, 1.0, 0.0), t); 
        } else {
             // Non-vegetation - Red/Maroon
             // Normalize -1.0 to -0.1 -> 0.0 to 1.0
             float t = clamp((vari + 1.0) / 0.9, 0.0, 1.0);
             // mix(Dark Red, Bright Red)
             outColor = mix(vec3(0.4, 0.0, 0.0), vec3(0.9, 0.2, 0.0), t);
        }

        material.diffuse = outColor;
    }
    `
});

const waterShader = new Cesium.CustomShader({
    fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 color = material.diffuse;
        float red = color.r;
        float green = color.g;
        float blue = color.b;

        // Custom Water Index: (Blue - (Red + Green)/2) / (Blue + (Red + Green)/2)
        // Highlights dominance of Blue over Red+Green
        
        float rgAvg = (red + green) * 0.5;
        float denominator = blue + rgAvg;

        if (abs(denominator) < 0.0001) {
            return;
        }

        float waterIndex = (blue - rgAvg) / denominator;

        // Visualization
        // High index (> 0.1) -> Blue (Threshold raised to avoid trees)
        // Low index (< 0.1) -> Black

        vec3 outColor;

        if (waterIndex > 0.1) {
            // Water/Blue dominant - Blue gradient
            // Normalize 0.1 to 1.0
            float t = clamp((waterIndex - 0.1) / 0.9, 0.0, 1.0);
            outColor = mix(vec3(0.0, 0.0, 0.4), vec3(0.0, 0.0, 1.0), t); // Dark Blue to Pure Blue
        } else {
             // Non-water - Black
             outColor = vec3(0.0, 0.0, 0.0);
        }

        material.diffuse = outColor;
    }
    `
});

window.toggleVari = () => {
    variEnabled = !variEnabled;
    const btnVari = document.getElementById('btnVari');

    if (variEnabled) {
        btnVari.innerHTML = '🍃 VARI Filter: ON';
        btnVari.classList.add('active');

        if (waterEnabled) {
            waterEnabled = false;
            const btnWater = document.getElementById('btnWater');
            btnWater.innerHTML = '💧 Water Filter: OFF';
            btnWater.classList.remove('active');
        }
    } else {
        btnVari.innerHTML = '🍂 VARI Filter: OFF';
        btnVari.classList.remove('active');
    }

    if (tilesetActual) {
        tilesetActual.customShader = variEnabled ? variShader : (waterEnabled ? waterShader : undefined);
    }
};

window.toggleWater = () => {
    waterEnabled = !waterEnabled;
    const btnWater = document.getElementById('btnWater');

    if (waterEnabled) {
        btnWater.innerHTML = '💧 Water Filter: ON';
        btnWater.classList.add('active');

        if (variEnabled) {
            variEnabled = false;
            const btnVari = document.getElementById('btnVari');
            btnVari.innerHTML = '🍂 VARI Filter: OFF';
            btnVari.classList.remove('active');
        }
    } else {
        btnWater.innerHTML = '💧 Water Filter: OFF';
        btnWater.classList.remove('active');
    }

    if (tilesetActual) {
        tilesetActual.customShader = waterEnabled ? waterShader : (variEnabled ? variShader : undefined);
    }
};

const originalCargarModelo = window.cargarModelo;
window.cargarModelo = async id => {

    try {
        if (tilesetActual) {
            viewer.scene.primitives.remove(tilesetActual);
            tilesetActual = null;
        }

        console.log("Cargando " + modelos[id] + " (ID: " + id + ")...");

        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(id);

        if (variEnabled) {
            tileset.customShader = variShader;
        } else if (waterEnabled) {
            tileset.customShader = waterShader;
        }

        tilesetActual = viewer.scene.primitives.add(tileset);

        await tilesetActual.readyPromise;

        document.getElementById('modelControls').style.display = 'flex';
        const slider = document.getElementById('heightSlider');
        slider.value = 0;

        window.currentModelCenter = Cesium.Cartesian3.clone(tilesetActual.boundingSphere.center);
        window.currentSurfaceNormal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(window.currentModelCenter);

        updateHeight(slider.value);

        viewer.zoomTo(tilesetActual);
    } catch (error) {
        console.error('Error cargando modelo:', error);
    }
};

window.updateHeight = (value) => {
    if (!tilesetActual || !window.currentSurfaceNormal) return;

    const offset = MODEL_HEIGHT_OFFSET + parseFloat(value);
    const translation = Cesium.Cartesian3.multiplyByScalar(window.currentSurfaceNormal, offset, new Cesium.Cartesian3());
    tilesetActual.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
};

window.toggleVisibility = () => {
    if (!tilesetActual) return;

    tilesetActual.show = !tilesetActual.show;

    const btn = document.getElementById('btnVisibility');
    if (tilesetActual.show) {
        btn.innerHTML = 'Visibility 👁️';
        btn.classList.remove('hidden-model');
        btn.title = "Ocultar Modelo";
    } else {
        btn.innerHTML = 'Visibility 🚫';
        btn.classList.add('hidden-model');
        btn.title = "Mostrar Modelo";
    }
};

window.irMundo = () => {
    if (tilesetActual) {
        viewer.scene.primitives.remove(tilesetActual);
        tilesetActual = null;
    }

    document.getElementById('modelSelect').value = "";
    document.getElementById('modelControls').style.display = 'none';

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-4, 40, 18000000),
        duration: 2
    });
};