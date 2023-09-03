import shader from './render-shader.wgsl';
import csColormap from '../../common/colormap-comp.wgsl';
import csFunc from '../../common/complex-func.wgsl';
import csIterate from './iterate-func-comp.wgsl';
import { getIdByColormapName } from '../../common/colormap-selection';
import * as ws from 'webgpu-simplified';

const createPipeline = async (init: ws.IWebGPUInit): Promise<ws.IPipeline> => { 
    const descriptor = ws.createRenderPipelineDescriptor({
        init, shader,
        isDepthStencil: false,
    })
    const pipeline = await init.device.createRenderPipelineAsync(descriptor);
   
    
    const texture = init.device.createTexture({
        size: init.size,
        format: 'rgba8unorm',
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
   
    const sampler = init.device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
    });       

    const uniformBindGroup = ws.createBindGroup(init.device, pipeline.getBindGroupLayout(0), 
        [ ], [texture.createView(), sampler]);

    return {
        pipelines: [pipeline],
        uniformBindGroups: [uniformBindGroup],
        gpuTextures: [texture],
    };
}

const createComputePipeline = async (device: GPUDevice, texture: GPUTexture): Promise<ws.IPipeline> => {  
    let csShader = csIterate.concat(csFunc.concat(csColormap));  
    const descriptor = ws.createComputePipelineDescriptor(device, csShader);
    const csPipeline = await device.createComputePipelineAsync(descriptor);

    const intParamsBufferSize = 
        1 * 4 + // funcSelect: u32
        1 * 4 + // colorSelect: u32
        2 * 4 + // padding
        0;      
    const intBuffer = ws.createBuffer(device, intParamsBufferSize);

    const floatParamsBufferSize = 
        1 * 4 + // a: f32
        1 * 4 + // width: f32
        1 * 4 + // height: f32
        1 * 4 + // scale: f32
        0;      
    
    const floatBuffer = ws.createBuffer(device, floatParamsBufferSize);
    const csBindGroup = ws.createBindGroup(device, csPipeline.getBindGroupLayout(0), 
        [intBuffer, floatBuffer], [texture.createView()]);
    
    return {
        csPipelines: [csPipeline],
        uniformBuffers: [intBuffer, floatBuffer],
        uniformBindGroups: [csBindGroup],        
    } 
}

const draw = (init:ws.IWebGPUInit, p:ws.IPipeline, p2:ws.IPipeline) => {  
    const commandEncoder =  init.device.createCommandEncoder();
    let wsize = 8;

    // compute pass
    {
        const csPass = commandEncoder.beginComputePass();
        csPass.setPipeline(p2.csPipelines[0]);
        csPass.setBindGroup(0, p2.uniformBindGroups[0]);
        csPass.dispatchWorkgroups(Math.ceil(init.size.width / wsize), Math.ceil(init.size.height / wsize));
        csPass.end();
    }
    
    // rander pass
    {
        const descriptor = ws.createRenderPassDescriptor({ init });
        const renderPass = commandEncoder.beginRenderPass(descriptor);

        // draw cube
        renderPass.setPipeline(p.pipelines[0]);
        renderPass.setBindGroup(0, p.uniformBindGroups[0]);
        renderPass.draw(6, 1, 0, 0);
        renderPass.end();
    }
    init.device.queue.submit([commandEncoder.finish()]);
}

export const run = async () => {
    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    const init = await ws.initWebGPU({canvas});

    const p = await createPipeline(init);
    const p2 = await createComputePipeline(init.device, p.gpuTextures[0]);

    var gui = ws.getDatGui();    
    const params = {
        animateSpeed: 1,
        scale: 5,
        functionSelection: 0,
        colorSelection: 'default',   
    };

    let colormapSelection = 23;
    
    gui.add(params, 'animateSpeed', 0, 5, 0.1);
    gui.add(params, 'scale', 1, 10, 0.1);
    gui.add(params, 'functionSelection', 0, 10, 1);
    gui.add(params, 'colorSelection', ['default',
        'autumn', 'black', 'blue', 'bone', 'cool', 'cooper', 'cyan', 'fuchsia', 'green', 'greys', 'hsv',
        'hot', 'jet', 'rainbow', 'rainbow_soft', 'red', 'spring', 'summer', 'white', 'winter', 'yellow'
    ]).onChange((val:string) => {
        if(val === 'default') colormapSelection = 23;
        else colormapSelection = getIdByColormapName(val);
    }); 
   
    let stats = ws.getStats();
    let start = Date.now();
    const frame = () => {     
        stats.begin();
       
        var dt = (Date.now() - start)/1000 * params.animateSpeed;
        init.device.queue.writeBuffer(p2.uniformBuffers[0], 0, new Uint32Array([
            params.functionSelection,
            colormapSelection,
            0,
            0,
        ]));
        init.device.queue.writeBuffer(p2.uniformBuffers[1], 0, new Float32Array([
            0.5*(1 + Math.cos(dt)),
            init.size.width,
            init.size.height,
            params.scale,
        ]));
        
        draw(init, p, p2);   

        requestAnimationFrame(frame);
        stats.end();
    };
    frame();
}

run();