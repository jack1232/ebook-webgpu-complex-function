import shader from '../../common/shader-unlit.wgsl';
import csColormap from '../../common/colormap-comp.wgsl';
import csFunc from '../../common/complex-func.wgsl';
import csSurface from './complex3d-comp.wgsl';
import csIndices from './indices-comp.wgsl';
import * as ws from 'webgpu-simplified';
import { getIdByColormapName } from '../../common/colormap-selection';
import { vec3, mat4 } from 'gl-matrix';

var resolution = 512;
var numVertices = resolution * resolution;
var numTriangles = 6 * (resolution - 1) * (resolution - 1);

const positionOffset = 0;
const colorOffset = 4 * 4;
const vertexByteSize = 
    3 * 4 + // position: vec3f
    1 * 4 + // padding f32
    3 * 4 + // color: vec3f
    1 * 4 + // padding: f32
    0;

const createPipeline = async (init: ws.IWebGPUInit): Promise<ws.IPipeline> => {
    // pipeline for shape
    const descriptor = ws.createRenderPipelineDescriptor({
        init, shader,
        buffers: ws.setVertexBuffers(['float32x3', 'float32x3'], //pos, col 
            [positionOffset, colorOffset], vertexByteSize),
    })
    const pipeline = await init.device.createRenderPipelineAsync(descriptor);

    
    // uniform buffer for transform matrix
    const  vertUniformBuffer = ws.createBuffer(init.device, 64);
    
    // uniform bind group for vertex shader
    const vertBindGroup = ws.createBindGroup(init.device, pipeline.getBindGroupLayout(0), [vertUniformBuffer]);
  
   // create depth view
   const depthTexture = ws.createDepthTexture(init);

   // create texture view for MASS (count = 4)
   const msaaTexture = ws.createMultiSampleTexture(init);

    return {
        pipelines: [pipeline],
        uniformBuffers: [
            vertUniformBuffer,    // for vertex
        ],
        uniformBindGroups: [vertBindGroup],
        depthTextures: [depthTexture],
        gpuTextures: [msaaTexture],
    };
}

const createComputeIndexPipeline = async(device: GPUDevice): Promise<ws.IPipeline> => {   
    const descriptor = ws.createComputePipelineDescriptor(device, csIndices);
    const csIndexPipeline = await device.createComputePipelineAsync(descriptor);

    const indexBuffer = ws.createBuffer(device, numTriangles * 4, ws.BufferType.IndexStorage);
    const indexUniformBuffer = ws.createBuffer(device, 4);

    device.queue.writeBuffer(indexUniformBuffer, 0, Uint32Array.of(resolution));
    const indexBindGroup = ws.createBindGroup(device, csIndexPipeline.getBindGroupLayout(0), 
        [indexBuffer, indexUniformBuffer]); 

    const indexEncoder = device.createCommandEncoder();
    const indexPass = indexEncoder.beginComputePass();
    indexPass.setPipeline(csIndexPipeline);
    indexPass.setBindGroup(0, indexBindGroup);
    indexPass.dispatchWorkgroups(Math.ceil(resolution / 8), Math.ceil(resolution / 8));
    indexPass.end();
    device.queue.submit([indexEncoder.finish()]);

    return {
        vertexBuffers:[indexBuffer]
    };
}

const createComputePipeline = async (device:GPUDevice): Promise<ws.IPipeline> => {
    const csShader = csColormap.concat(csFunc.concat(csSurface));
    const descriptor = ws.createComputePipelineDescriptor(device, csShader);
    const csPipeline = await device.createComputePipelineAsync(descriptor);

    const vertexBuffer = ws.createBuffer(device, numVertices * vertexByteSize, ws.BufferType.VertexStorage);

    const csParamsBufferSize = 
        1 * 4 + // resolution: f32
        1 * 4 + // funcSelection: f32
        1 * 4 + // plotSelection: f32
        1 * 4 + // colormapSelection: f32
        1 * 4 + // animationTime: f32
        1 * 4 + // scale: f32
        1 * 4 + // aspectRatio: f32
        1 * 4 + // padding
        0;

    const csParamsBuffer = ws.createBuffer(device, csParamsBufferSize);
    const csBindGroup = ws.createBindGroup(device, csPipeline.getBindGroupLayout(0), [vertexBuffer, csParamsBuffer]);

    return {
        csPipelines: [csPipeline],
        vertexBuffers: [vertexBuffer],
        uniformBuffers: [csParamsBuffer],
        uniformBindGroups: [csBindGroup],        
    }
}

const draw = (init:ws.IWebGPUInit, p:ws.IPipeline, p2:ws.IPipeline, p3: ws.IPipeline) => {  
    const commandEncoder =  init.device.createCommandEncoder();    
    
    // compute pass
    {
        const csPass = commandEncoder.beginComputePass();
        csPass.setPipeline(p2.csPipelines[0]);
        csPass.setBindGroup(0, p2.uniformBindGroups[0]);
        csPass.dispatchWorkgroups(Math.ceil(resolution / 8), Math.ceil(resolution / 8));
        csPass.end();
    }
    
    // render pass
    {
        const descriptor = ws.createRenderPassDescriptor({
            init,
            depthView: p.depthTextures[0].createView(),
            textureView: p.gpuTextures[0].createView(),
        });
        const renderPass = commandEncoder.beginRenderPass(descriptor);
        
        // draw surface        
        renderPass.setPipeline(p.pipelines[0]);
        renderPass.setVertexBuffer(0, p2.vertexBuffers[0]);
        renderPass.setBindGroup(0, p.uniformBindGroups[0]);
        renderPass.setIndexBuffer(p3.vertexBuffers[0], 'uint32');
        renderPass.drawIndexed(numTriangles);

        renderPass.end();
    }
    init.device.queue.submit([commandEncoder.finish()]);
}

const run = async () => {
    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    const deviceDescriptor: GPUDeviceDescriptor = {
        requiredLimits:{
            maxStorageBufferBindingSize: 512*1024*1024 //512MB, defaulting to 128MB
        }
    }
    const init = await ws.initWebGPU({canvas, msaaCount: 4}, deviceDescriptor);

    let p = await createPipeline(init);
    let p2 = await createComputePipeline(init.device);
    let p3 = await createComputeIndexPipeline(init.device);
    
    var gui =  ws.getDatGui();
    const params = {
        plotType: 'magnitude',
        funcSelection: 0,
        rotateSpeed: 0,
        animateSpeed: 2,
        resolution: 1024,
        scale: 1,
        aspectRatio: 0.8,
        colormap: 'jet',
    };
    
    let colormapSelection = 0;
    let plotType = 0;
    let resolutionChanged = false;

    var folder = gui.addFolder('Set plot Parameters');
    folder.open();
    folder.add(params, 'plotType', ['magnitude', 'angle', 'real', 'imaginary' ]).onChange((val) => {
        if(val === 'magnitude') plotType = 0;
        else if (val === 'angle') plotType = 1;
        else if (val === 'real') plotType = 2;
        else if (val === 'imaginary') plotType = 3;
    });  
    folder.add(params, 'funcSelection', 0, 10, 1)
    folder.add(params, 'animateSpeed', 0, 10, 0.1);
    folder.add(params, 'rotateSpeed', 0, 10, 0.1);
    folder.add(params, 'resolution', 16, 2048, 8).onChange((val) => {     
        resolution = val; 
        resolutionChanged = true;
    });
    folder.add(params, 'scale', 0.3, 5, 0.1); 
    folder.add(params, 'aspectRatio', 0.1, 5, 0.1); 
    folder.add(params, 'colormap', [
        'autumn', 'black', 'blue', 'bone', 'cool', 'cooper', 'cyan', 'fuchsia', 'green', 'greys', 'hsv', 'hot', 
        'jet', 'rainbow', 'rainbow_soft', 'red', 'spring', 'summer', 'white', 'winter', 'yellow'
    ]).onChange((val:string) => {
        colormapSelection = getIdByColormapName(val);
    }); 
    
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

    const frame = async () => {     
        stats.begin();

        if(resolutionChanged){
            resolution = params.resolution;
            numVertices = resolution * resolution;
            numTriangles = 6 * (resolution - 1) * (resolution - 1);
            p2 = await createComputePipeline(init.device);
            p3 = await createComputeIndexPipeline(init.device);
            resolutionChanged = false;
        }

        projectMat = ws.createProjectionMat(aspect); 
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
         
        // update uniform buffer for compute shader
        init.device.queue.writeBuffer(p2.uniformBuffers[0], 0, Float32Array.of(
            resolution,
            params.funcSelection,
            plotType,
            colormapSelection,            
            0.5*(1 + Math.cos(params.animateSpeed * dt)),
            params.scale,
            params.aspectRatio,
            0
        ));
      
        draw(init, p, p2, p3);      
    
        requestAnimationFrame(frame);
        stats.end();
    };
    frame();
}

run();