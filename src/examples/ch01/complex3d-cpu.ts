import shader from '../../common/shader-unlit.wgsl';
import { createComplexData } from './complex3d-data';
import * as ws from 'webgpu-simplified';
import { vec3, mat4 } from 'gl-matrix';

const createPipeline = async (init: ws.IWebGPUInit, data:any): Promise<ws.IPipeline> => {
    const descriptor = ws.createRenderPipelineDescriptor({
        init, shader,
        buffers: ws.setVertexBuffers(['float32x3', 'float32x3']), // position, color
    });
    const pipeline = await init.device.createRenderPipelineAsync(descriptor);

    const vertexBuffer = ws.createBufferWithData(init.device, data.positions);
    const colorBuffer = ws.createBufferWithData(init.device, data.colors);
    const indexBuffer = ws.createBufferWithData(init.device, data.indices);

    // uniform buffer for transform matrix
    const  vertUniformBuffer = ws.createBuffer(init.device, 64);
    const vertBindGroup = ws.createBindGroup(init.device, pipeline.getBindGroupLayout(0), [vertUniformBuffer]);

    // create depth texture
   const depthTexture = ws.createDepthTexture(init);

   // create texture view for MASS (count = 4)
   const msaaTexture = ws.createMultiSampleTexture(init);

    return {
        pipelines: [pipeline],
        vertexBuffers: [vertexBuffer, colorBuffer, indexBuffer],
        uniformBuffers: [vertUniformBuffer],
        uniformBindGroups: [vertBindGroup],
        depthTextures: [depthTexture],
        gpuTextures: [msaaTexture],
    };
}

const draw = (init:ws.IWebGPUInit, p:ws.IPipeline, data:any) => {  
    const commandEncoder =  init.device.createCommandEncoder();
    const descriptor = ws.createRenderPassDescriptor({
        init,
        depthView: p.depthTextures[0].createView(),
        textureView: p.gpuTextures[0].createView(),
    });
    const renderPass = commandEncoder.beginRenderPass(descriptor);

    // draw terrain
    renderPass.setPipeline(p.pipelines[0]);
    renderPass.setVertexBuffer(0, p.vertexBuffers[0]);
    renderPass.setVertexBuffer(1, p.vertexBuffers[1]);
    renderPass.setBindGroup(0, p.uniformBindGroups[0]);
    renderPass.setIndexBuffer(p.vertexBuffers[2], 'uint32');
    renderPass.drawIndexed(data.indices.length);

    renderPass.end();
    init.device.queue.submit([commandEncoder.finish()]);
}

const run = async () => {
    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    const init = await ws.initWebGPU({canvas, msaaCount: 4});

    let data = createComplexData({  
        xmin: -3,
        xmax: 2,
        zmin: -2, 
        zmax: 2,
        nx: 101,
        nz: 101,
    });    
    let p = await createPipeline(init, data);

    var gui = ws.getDatGui();
    const params = {
        plotType: 'magnitude',
        funcSelection: 0,
        animateSpeed: 1,
        rotateSpeed: 0,
        nx: 200,
        nz: 200,
        scale: 1,
        aspectRatio: 1,
        colormap: 'jet',
    };

    let xmin = -3;
    let xmax = 2;
    let zmin = -2;
    let zmax = 2;
   
    var folder = gui.addFolder('Set Plot Parameters');
    folder.open();
    folder.add(params, 'plotType', ['magnitude', 'angle', 'real', 'imaginary' ]);  
    folder.add(params, 'funcSelection', 0, 10, 1).onChange((val) => {
        if(val === 0){
            xmin = -3, xmax = 2, zmin = -2, zmax = 2;
        } else if(val === 1){
            xmin = -6, xmax = 6, zmin = -6, zmax = 6;
        } else if(val === 2){
            xmin = -6, xmax = 6, zmin = -6, zmax = 6;
        } else if(val === 3){
            xmin = -10, xmax = 10, zmin = -1, zmax = 1;
        } else if(val === 4){
            xmin = -8, xmax = 8, zmin = -2, zmax = 2;
        } else if(val === 5){
            xmin = -2, xmax = 2, zmin = -2, zmax = 2;
        } else if(val === 6){
            xmin = -1, xmax = 2, zmin = -1, zmax = 1;
        } else if(val === 7){
            xmin = -2, xmax = 2, zmin = -1, zmax = 1;
        } else if(val === 8){
            xmin = -1, xmax = 1, zmin = -1, zmax = 1;
        } else if(val === 9){
            xmin = -4, xmax = 6, zmin = -2, zmax = 2;
        } else if(val === 10){
            xmin = -2, xmax = 2, zmin = -2, zmax = 2;
        }
    });
    folder.add(params, 'animateSpeed', 0, 10, 0.1);
    folder.add(params, 'rotateSpeed', 0, 10, 0.1);
    folder.add(params, 'nx', 11, 300, 1); 
    folder.add(params, 'nz', 11, 300, 1); 
    folder.add(params, 'scale', 0.3, 5, 0.1); 
    folder.add(params, 'aspectRatio', 0.3, 1, 0.1); 
    folder.add(params, 'colormap', [
        'autumn', 'bone', 'cool', 'copper', 'greys', 'hsv', 'hot', 'jet', 'rainbow', 'rainbow_soft', 
        'spring', 'summer', 'winter', 'black', 'blue', 'cyan', 'fuchsia', 'green', 'red', 'white', 'yellow'
    ]);  
    
    let modelMat = mat4.create();
    let vt = ws.createViewTransform([1.5, 1.5, 1.5]);
    let viewMat = vt.viewMat;

    let aspect = init.size.width / init.size.height;  
    let rotation = vec3.fromValues(0, 0, 0);  
    let projectMat = ws.createProjectionMat(aspect);  
    
    let mvpMat = ws.combineMvpMat(modelMat, viewMat, projectMat);
    var camera = ws.getCamera(canvas, vt.cameraOptions);
    
    let start = performance.now();
    let stats = ws.getStats();
    const frame = () => {     
        stats.begin();
        if(camera.tick()){
            viewMat = camera.matrix;
            mvpMat = ws.combineMvpMat(modelMat, viewMat, projectMat);
        }
        var dt = (performance.now() - start)/1000; 
        rotation[0] = Math.sin(dt * params.rotateSpeed);
        rotation[1] = Math.cos(dt * params.rotateSpeed); 
        modelMat = ws.createModelMat([0,0.5,0], rotation); 
        mvpMat = ws.combineMvpMat(modelMat, viewMat, projectMat);
        init.device.queue.writeBuffer(p.uniformBuffers[0], 0, mvpMat as ArrayBuffer); 
        
        // update vertex and index buffers
        const len0 = data.positions.length;
        data = createComplexData({
            plotType: params.plotType,
            funcSelection: params.funcSelection,
            xmin,
            xmax,
            zmin,
            zmax,
            nx: params.nx,
            nz: params.nz,
            scale: params.scale,
            aspect: params.aspectRatio,
            colormapName: params.colormap,
            a: 0.5*(1 + Math.cos(params.animateSpeed * dt)),
        });
        const pData = [data.positions, data.colors, data.indices];
        ws.updateVertexBuffers(init.device, p, pData, len0);
               
        draw(init, p, data);      

        requestAnimationFrame(frame);
        stats.end();
    };
    frame();
}

run();