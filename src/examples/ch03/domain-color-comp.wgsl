fn cFunc(z:vec2f, a:f32, selectId:u32) -> vec2f {
    var fz = z;

    if (selectId == 0u) {
        let f1 = z - vec2(a, 0.0);
        let f2 = cMul(z,z) + z + vec2(a, 0.0);
        fz = cDiv(f1, f2); 
    } else if (selectId == 1u) {
        fz = cSqrt(cDiv(cLog(vec2(-z.y - 3.0*a, z.x)), cLog(vec2(-z.y + a, z.x))));
    } else if (selectId == 2u){
        fz = a*cSin(a*z);
    } else if(selectId == 3u){
        fz = (a+0.5)*cTan(cTan((a+0.5)*z));
    } else if(selectId == 4u){
        fz = a*cTan(cSin((a+0.5)*z));
    } else if (selectId == 5u){
        fz = cSqrt(vec2(a + z.x, z.y)) + cSqrt(vec2(a - z.x, -z.y));
    } else if (selectId == 6u){
        fz = cDiv(cTan(cExp2((0.5+a)*z)), z);
    } else if (selectId == 7u){
        fz = cDiv(cSin(cCos(cSin((a+0.5)*z))), cMul(z,z) - a);
    } else if (selectId == 8u){
        fz = (a+0.5)*cInv(cAdd(cPow((a+0.5)*z,5.0), 1.0));
    } else if (selectId == 9u){
        fz = cDiv(cSin((a+0.5)*z), cMul(cCos(cExp2((a+0.5)*z)), cMul(z,z)- vec2((a+0.5)*(a+0.5),0.0)));
    } else if (selectId == 10u) {
        fz = cInv(z + vec2(a, 0.0)) + cInv(z - vec2(a, 0.0));
    } else if(selectId == 11u){
        fz = cInv(z);
    } else if(selectId == 12u){
        fz = z;
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
    let funcId =  ips.funcSelect;
    let colorId = ips.colorSelect;    

    var z = vec2(scale*(f32(id.x) - 0.5*w)/w, -scale*(h/w)*(f32(id.y) - 0.5*h)/h);
    let fz = cFunc(z, a, funcId);

    var color:vec4f;
    if (colorId <= 22u) { // colormaps
        color = vec4(colormap2Rgb(fz, colorId), 1.0);
    } else { // default
        color = vec4(hsv2Rgb(fz), 1.0); 
    }

    textureStore(tex, vec2(id.xy), color);
}