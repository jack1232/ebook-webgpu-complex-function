import { vec3 } from "gl-matrix";
import { addColors, colormapData } from '../../common/colormap-data';
let Complex = require('complex.js');

interface IComplexInput {
    plotType?: string,
    funcSelection?: number,
    xmin?: number,
    xmax?: number,
    zmin?: number,
    zmax?: number,
    nx?: number,
    nz?: number,
    scale?: number,
    aspect?: number,
    colormapName?: string,
    a?: number, // animation parameter
}

interface IComplexOutput {
    positions?: Float32Array,
    colors?: Float32Array,
    indices?: Uint32Array,
}

const cFunc = (x:number, y:number, ci: IComplexInput) => {
    let z = new Complex(x, y);
    let fz = z;
    let funcSelection = ci.funcSelection;
    let a = ci.a;

    if(funcSelection === 0) { 
        // fz = (z-a)/(z^2 + z + a) 
        let f1 = z.sub(a);
        let f2 = z.mul(z).add(z).add(a);
        fz = f1.div(f2);
    } else if (funcSelection === 1) {
        let f1 = new Complex(-z.im -3*a, z.re);
        let f2 = new Complex(-z.im + a, z.re);
        fz = f1.div(f2).sqrt();
    } else if (funcSelection === 2) {
        fz = z.mul(a).sin().mul(a);
    } else if (funcSelection === 3) {
        fz = Complex(a + 0.5).mul(z).tan().tan().mul(Complex(a+0.5));
    } else if (funcSelection === 4) {
        fz = Complex(a + 0.5).mul(z).sin().tan().mul(a);
    } else if (funcSelection === 5) {
        let f1 = new Complex(a + z.re, z.im);
        let f2 = new Complex(a - z.re, -z.im);
        fz = f1.sqrt().add(f2.sqrt());
    } else if (funcSelection === 6) {
        fz = Complex(0.5 + a).mul(z).exp().tan().div(z);
    } else if (funcSelection === 7) {
        fz = Complex(a + 0.5).mul(z).sin().cos().sin().div(z.mul(z).sub(a));
    } else if (funcSelection === 8) {
        fz = Complex(a + 0.5).mul(z).pow(5).add(1).inverse().mul(a + 0.5);
    } else if (funcSelection === 9) {
        let f1 = Complex(a+0.5).mul(z).sin();
        let f2 = Complex(a+0.5).mul(z).exp().cos().mul(z.mul(z).sub((a+0.5)*(a+0.5)));
        fz = f1.div(f2);
    } else if (funcSelection === 10) {
        let f1 = z.add(a).inverse();
        let f2 = z.sub(a).inverse();
        fz = f1.add(f2);
    }

    return {
        mag: vec3.fromValues(x, fz.abs(), y),
        arg: vec3.fromValues(x, fz.arg(), y),
        re: vec3.fromValues(x, fz.re, y),
        im: vec3.fromValues(x, fz.im, y),
    }
}

const normalizePoint = (pt:vec3, xmin:number, xmax:number, ymin:number, ymax:number, 
zmin:number, zmax:number, scale:number, aspect: number) => {
    pt[0] = scale * (-1 + 2 * (pt[0] - xmin) / (xmax - xmin));
    pt[1] = scale * (-1 + 2 * (pt[1] - ymin) / (ymax - ymin)) * aspect;
    pt[2] = scale * (-1 + 2 * (pt[2] - zmin) / (zmax - zmin));
    return pt;
}

const complexDataRange = (ci: IComplexInput) => {
    const dx = (ci.xmax - ci.xmin)/ci.nx;
    const dz = (ci.zmax - ci.zmin)/ci.nz;

    let cmin = Number.MAX_VALUE;
    let cmax = Number.MIN_VALUE;
    let ymin = Number.MAX_VALUE;
    let ymax = Number.MIN_VALUE;

    let ps: any = [], cps: any = [];
    let pt:vec3;

    for(let i = 0; i <= ci.nx; i++) {
        let x = ci.xmin + i * dx;
        let ps1 = [], cps1 =[];
        for(let j = 0; j <= ci.nz; j++) {
            let z = ci.zmin + j * dz;
            let pts = cFunc(x, z, ci);
            if(ci.plotType === 'magnitude') pt = pts.mag;
            else if(ci.plotType === 'angle') pt = pts.arg;
            else if(ci.plotType === 'real') pt = pts.re;
            else if (ci.plotType === 'imaginary') pt = pts.im;
            ps1.push(pt);
            cps1.push(pts.arg[1]);

            ymin = pt[1] < ymin? pt[1] : ymin;
            ymax = pt[1] > ymax? pt[1] : ymax;
            cmin = pts.arg[1] < cmin? pts.arg[1] : cmin;
            cmax = pts.arg[1] > cmax? pts.arg[1] : cmax;
        }
        ps.push(ps1);
        cps.push(cps1);
    }

    for(let i = 0; i <= ci.nx; i++){
        for(let j = 0; j <= ci.nz; j++){
            ps[i][j] = normalizePoint(ps[i][j], ci.xmin, ci.xmax, ymin, ymax, 
                ci.zmin, ci.zmax, ci.scale, ci.aspect);
        }
    }

    return {
        positions: ps,
        cPositions: cps,
        ymin: ymin,
        ymax: ymax,
        cmin: cmin,
        cmax: cmax,
    }
}

export const createComplexData = (ci: IComplexInput) : IComplexOutput => {
    // define default values for input parameters:
    ci.scale = ci.scale === undefined? 1: ci.scale;
    ci.aspect = ci.aspect === undefined? 1: ci.aspect;
    ci.colormapName = ci.colormapName === undefined? 'jet': ci.colormapName;
    ci.funcSelection = ci.funcSelection === undefined? 0: ci.funcSelection;
    ci.plotType = ci.plotType === undefined? 'magnitude': ci.plotType;
    ci.a = ci.a === undefined? 0: ci.a;

    if(ci.nx < 2 || ci.nz < 2) return;

    let positions = [], colors = [];
    let cdr = complexDataRange(ci);
    const cdata = colormapData(ci.colormapName);

    for(let i = 0; i <= ci.nx; i++){
        for(let j = 0; j <= ci.nz; j++){
            let pos = cdr.positions[i][j];
            positions.push(pos[0], pos[1], pos[2]);
            let color = addColors(cdata, cdr.cmin, cdr.cmax, cdr.cPositions[i][j]);
            colors.push(color[0], color[1], color[2]);
        }
    }

    // calculate indices
    let n_vertices_per_row = ci.nz + 1;
    let indices = [];
    for(let i = 0; i < ci.nx; i++){
        for(let j = 0; j < ci.nz; j++) {
            let idx0 = j + i * n_vertices_per_row;
            let idx1 = j + 1 + i * n_vertices_per_row;
            let idx2 = j + 1 + (i + 1) * n_vertices_per_row;
            let idx3 = j + (i + 1) * n_vertices_per_row; 

            indices.push(idx0, idx1, idx2, idx2, idx3, idx0);          
        }
    }
    return {
        positions: new Float32Array(positions.flat()),
        colors: new Float32Array(colors.flat()),
        indices: new Uint32Array(indices),
    };
}