fn cFunc(z:vec2f, a:f32, selectId:u32) -> array<vec3f,4> {
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
    } 
    
    return array<vec3f, 4>(
        vec3(z.x, fz.x, z.y),       // real part
        vec3(z.x, fz.y, z.y),       // imaginary part
        vec3(z.x, length(fz), z.y), // magnitude
        vec3(z.x, cArg(fz), z.y)  // argument or angle
    );
}

struct DataRange {
    xRange: vec2f,
    yRange: vec2f,
    zRange: vec2f,
    cRange: vec2f,
}

fn getDataRange(funcSelection:u32, plotSelection:u32) -> DataRange{
	var dr:DataRange;

	if (funcSelection == 0u) { 
		dr.xRange = vec2(-3.0, 2.0);
		dr.zRange = vec2(-2.0, 2.0);
        dr.cRange = vec2(-2.1*pi, 2.1*pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 45.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-43.5, 33.2);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-39.2, 27.6);
        }
	} else if (funcSelection == 1u) {
		dr.xRange = vec2(-6.0, 6.0);
		dr.zRange = vec2(-6.0, 6.0);
        dr.cRange = vec2(-pi/2.0, pi/2.0);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 7.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi/2.0, pi/2.0);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(0, 6.4);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-5.5, 5.5);
        }
	} else if (funcSelection == 2u) {
		dr.xRange = vec2(-6.0, 6.0);
		dr.zRange = vec2(-6.0, 6.0);
        dr.cRange = vec2(-pi, pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 203.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-203.0, 203.0);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-203.0, 203.0);
        }
	} else if (funcSelection == 3u) {
		dr.xRange = vec2(-10.0, 10.0);
		dr.zRange = vec2(-1.0, 1.0);
        dr.cRange = vec2(-pi, pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 30.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-14.2, 14.2);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-30.0, 30.0);
        }
	} else if (funcSelection == 4u) {
		dr.xRange = vec2(-8.0, 8.0);
		dr.zRange = vec2(-2.0, 2.0);
        dr.cRange = vec2(-pi, pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 27.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-14.6, 14.6);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-23.0, 23.0);
        }
	} else if (funcSelection == 5u) {
		dr.xRange = vec2(-2.0, 2.0);
		dr.zRange = vec2(-2.0, 2.0);
        dr.cRange = vec2(-pi/2.0, pi/2.0);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(1.4, 2.9);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi/2.0, pi/2.0);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(1.4, 2.8);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-1.0, 1.0);
        }
	} else if (funcSelection == 6u) {
		dr.xRange = vec2(-1.0, 2.0);
		dr.zRange = vec2(-1.0, 1.0);
        dr.cRange = vec2(-pi, pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 120.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-58.2, 84.1);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-105.3, 105.3);
        }
	} else if (funcSelection == 7u) {
		dr.xRange = vec2(-2.0, 2.0);
		dr.zRange = vec2(-1.0, 1.0);
        dr.cRange = vec2(-pi, pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 18.5);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-8.2, 13.0);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-13.2, 13.2);
        }
	} else if (funcSelection == 8u) {
		dr.xRange = vec2(-1.0, 1.0);
		dr.zRange = vec2(-1.0, 1.0);
        dr.cRange = vec2(-pi, pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 26.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-20.0, 17.6);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-26.0, 26.0);
        }
	} else if (funcSelection == 9u) {
		dr.xRange = vec2(-4.0, 6.0);
		dr.zRange = vec2(-2.0, 2.0);
        dr.cRange = vec2(-pi, pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 8.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-6.6, 6.0);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-5.3, 5.3);
        }
	} else if (funcSelection == 10u) {
		dr.xRange = vec2(-2.0, 2.0);
		dr.zRange = vec2(-2.0, 2.0);
        dr.cRange = vec2(-pi, pi);
        if(plotSelection == 0u) { // magnitude
            dr.yRange = vec2(0.0, 46.0);
        } else if (plotSelection == 1u) { // angle
            dr.yRange = vec2(-pi, pi);
        } else if (plotSelection == 2u) { // real
            dr.yRange = vec2(-23.0, 23.0);
        } else if (plotSelection == 3u) { // imaginary
            dr.yRange = vec2(-41.0, 41.0);
        }
	}
	return dr;
}

struct VertexData{
    position: vec3f,
    color: vec3f,
}

struct VertexDataArray{
    vertexDataArray: array<VertexData>,
}

struct ComplexParams {
    resolution: f32,
    funcSelection: f32,
    plotSelection: f32,
    colormapSelection: f32,
    animationTime: f32,
    scale: f32,
    aspectRatio: f32,
}

@group(0) @binding(0) var<storage, read_write> vda : VertexDataArray;
@group(0) @binding(1) var<uniform> cp: ComplexParams;

var<private> xmin:f32;
var<private> xmax:f32;
var<private> ymin:f32; 
var<private> ymax:f32;
var<private> zmin:f32; 
var<private> zmax:f32;
var<private> cmin:f32; 
var<private> cmax:f32;
var<private> aspect:f32;

fn getUv(i:u32, j:u32) -> vec2f {
    var dr = getDataRange(u32(cp.funcSelection), u32(cp.plotSelection));
	xmin = dr.xRange[0];
	xmax = dr.xRange[1];
	ymin = dr.yRange[0];
	ymax = dr.yRange[1];
	zmin = dr.zRange[0];
	zmax = dr.zRange[1];	
    cmin = dr.cRange[0];
    cmax = dr.cRange[1];

    var dx = (xmax - xmin)/(cp.resolution - 1.0);
    var dz = (zmax - zmin)/(cp.resolution - 1.0);
    var x = xmin + f32(i) * dx;
    var z = zmin + f32(j) * dz;
    return vec2(x, z);
}

fn normalizePoint(pos1: vec3f) -> vec3f {
    var pos = pos1;
    pos.x = (2.0 * (pos.x - xmin)/(xmax - xmin) - 1.0) * cp.scale;
    pos.y = (2.0 * (pos.y - ymin)/(ymax - ymin) - 1.0) * cp.scale;
    pos.z = (2.0 * (pos.z - zmin)/(zmax - zmin) - 1.0) * cp.scale;    
    pos.y = pos.y * cp.aspectRatio;
    return pos;
}

@compute @workgroup_size(8, 8, 1)
fn cs_main(@builtin(global_invocation_id) id : vec3u) {
    let i = id.x;
    let j = id.y;   
    let uv = getUv(i, j);
    let cArray = cFunc(uv, cp.animationTime, u32(cp.funcSelection));
    
    var pt:vec3f;
    var ang:vec3f = cArray[3];
    if (cp.plotSelection == 1) { // angle
        pt = cArray[3];
    } else if (cp.plotSelection == 2) { // real
        pt = cArray[0];
    } else if (cp.plotSelection == 3) { // imaginary
        pt = cArray[1];
    } else {    // defaulting to magnitude
        pt = cArray[2];
    }

    if(pt.y < ymin) {
        pt.y = ymin;
    }
    if(pt.y > ymax) {
        pt.y = ymax;
    }

    var ps = normalizePoint(pt);
    var cps = cArray[1];

    let color = colorLerp(u32(cp.colormapSelection), cmin, cmax, cps[1], 1);
   
    var idx = i + j * u32(cp.resolution);
    vda.vertexDataArray[idx].position = ps;
    vda.vertexDataArray[idx].color = color;
}