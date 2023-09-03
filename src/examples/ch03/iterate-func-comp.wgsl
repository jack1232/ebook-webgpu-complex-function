// define iterated complex functions
fn cFunc(z:vec2f, a:f32, selectId:u32) -> vec2f {
    var fz = z;
   
    if (selectId == 0u) {
        fz = cMul(vec2(a, a), cLog(cMul(z,z)));
    } else if (selectId == 1u){
        fz = cDiv(cLog(cMul(z,z)-vec2(0.0, a)), cExp(cMul(z,z))-vec2(a, 0.0));
    } else if (selectId == 2u){
        fz = cDiv(cCos(z), cSin(cMul(z,z) - vec2(0.5*a, 0.0)));
    } else if (selectId == 3u){
        let f1 = cInv(cPow(z, 4.0) + vec2(0.0, 0.1*a));
        fz = cAsinh(cSin(f1));
    } else if (selectId == 4u){
        let f1 = cInv(cPow(z, 6.0) + vec2(0.0, 0.5*a));
        fz = cLog(cSin(f1));
    } else if (selectId == 5u){
        let f1 = cMul(vec2<f32>(0.0,1.0), cCos(z));
        let f2 = cSin(cMul(z,z) - vec2(a, 0.0));
        fz = cDiv(f1, f2);
    } else if (selectId == 6u){
        let f1 = cCos(cMul(vec2<f32>(0.0,1.0), z));
        let f2 = cSin(cMul(z,z) - vec2(a, 0.0));
        fz = cDiv(f1, f2);
    } else if (selectId == 7u){
        let f1 = cTan(z);
        let f2 = cSin(cPow(z,8.0) - vec2(0.5*a, 0.0));
        fz = cDiv(f1, f2);
    } else if (selectId == 8u){
        fz = cInv(z) + cDiv(cMul(z,z), cSin(cPow(z,2.0) - vec2(a, 0.0)));
    } else if (selectId == 9u){
        fz = cConj(z) + cDiv(cMul(z,z), cSin(cPow(z,2.0) - vec2(2.0*a, 0.0)));
    } else if (selectId == 10u){
        fz = cSqrt(cMul(vec2(0.0,1.0), z)) + cDiv(cMul(z,z), cSin(cPow(z,2.0) - vec2(2.0*a, 0.0)));
    } else {
        fz = cMul(vec2(a), cLog(cMul(z,z)));
    }
    return fz;
}

struct IntParams {
    funcSelect: u32,   
    colorSelect: u32,             
}
@group(0) @binding(0) var<uniform> ips: IntParams;

struct FloatParams {
    animateParam: f32,
    width: f32,
    height: f32, 
    scale: f32,          
}
@group(0) @binding(1) var<uniform> fps: FloatParams;

@group(0) @binding(2) var tex: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
    let a = fps.animateParam;    
    let w = fps.width;
    let h = fps.height;
    let scale = fps.scale;
    var funcId =  ips.funcSelect;
    let colorId = ips.colorSelect;    

    var z = vec2(scale*(f32(id.x) - 0.5*w)/w, -scale*(h/w)*(f32(id.y) - 0.5*h)/h);
    let iters = array<u32,11>(4,3,4,2,2,5,4,10,6,9,4);
    if(funcId >= 10u) {
        funcId = 0u;
    }

    var i = 0u;
    loop {
        if(i >= iters[funcId]) { break; }      
        z = cFunc(z, a, funcId);
        i = i + 1u;
    }

    var color:vec4f;
    if (colorId > 0u && colorId < 22u) { // colormaps
        color = vec4(colormap2Rgb(z, colorId), 1.0);
    } else { // default
        color = vec4(hsv2Rgb(z), 1.0); 
    }

    textureStore(tex, vec2<i32>(id.xy), color);
}