

export interface RenderingOptions{

    maxMasterDetailsLevel?:number
    tabsTop?: boolean
    horizontalBooleans?: boolean,
    dialog?: boolean
    noStatus?:boolean
    noStatusDecorations?:boolean
    noMargin?: boolean
    kind?: string
    maxValuesForRadio?: number
    level?: number
}

export function defaultOptions():RenderingOptions{
    return {
        maxMasterDetailsLevel:2,
        noStatusDecorations: false
    }
}
export function clone(f:RenderingOptions,overrides:RenderingOptions={}):RenderingOptions{
    var rs={};
    Object.keys(f).forEach(x=>rs[x]=f[x]);
    Object.keys(overrides).forEach(x=>rs[x]=overrides[x]);
    return rs;
}

