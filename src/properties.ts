import keywords=require("./keywords")
interface IFacet {
    facetName(): string
    value(): any
}


export interface PropertyDescription {

    enumOptions?: any[]

    regExp?: string

    description?: string

    displayName?: string

    id?: string

    default?: string

    required?: boolean
    multiline?: boolean;
    scalar?: boolean
    boolean?: boolean
    nil?: boolean

    array?: boolean

    object?: boolean

    map?: boolean

    children?: PropertyDescription[];

    componentType?: PropertyDescription;
}


export class PropertyGroup {
    priority: number;
    caption: string
    properties: PropertyDescription[] = [];
}

export interface IPropertyGroupProvider {

    consumeProperty(p: PropertyDescription): boolean;

    getResult(): PropertyGroup[]
}

abstract class AbstractProvider implements IPropertyGroupProvider {
    _result: PropertyGroup = new PropertyGroup();

    abstract consume(p: PropertyDescription): boolean;

    consumeProperty(p: PropertyDescription): boolean {
        var r = this.consume(p);
        if (r) {
            this._result.properties.push(p);
        }
        return r;
    }

    getResult() {
        this.updateGroup();
        return [this._result];
    }

    updateGroup() {

    }
}
class RequiredProvider extends AbstractProvider {

    constructor() {
        super();
        this._result.caption = "General";
    }

    consume(p: PropertyDescription): boolean {
        return p.required&&p.scalar&&!p.multiline;
    }
}
class ObjectProvider implements IPropertyGroupProvider{
    _result: PropertyGroup[] = [];

    consumeProperty(p: PropertyDescription): boolean {
        if (p.object&&!p.map) {
            var g = new PropertyGroup();
            g.properties=p.children;
            g.caption = p.displayName;
            this._result.push(g);
            return true;
        }
        return false;
    }

    getResult() {
        return this._result;
    }
}

export function nicerName(n: string) {
    var result: string[] = [];
    var needUpperCase = true;
    var p = "";
    for (var i = 0; i < n.length; i++) {
        var c = n.charAt(i);
        if (p.toUpperCase() != p) {
            if (c.toLowerCase() != c) {
                result.push(' ');
            }
        }
        if (needUpperCase) {
            c = c.toUpperCase();
            needUpperCase = false;
        }

        result.push(c);
        p = c;
    }

    return result.join("");
}
class OtherScalar extends AbstractProvider {

    constructor() {
        super()
        this._result.caption = "Advanced"
    }

    consume(p: PropertyDescription): boolean {
        return (p.scalar&&!p.multiline);
    }
}
class CatchAll implements IPropertyGroupProvider {

    _result: PropertyGroup[] = [];

    consumeProperty(p: PropertyDescription): boolean {

        var g = new PropertyGroup();
        g.properties.push(p);
        g.caption = p.displayName;
        this._result.push(g);
        return true;
    }

    getResult() {

        return this._result;
    }
}
export function createProviders(): IPropertyGroupProvider[] {
    return [new RequiredProvider(), new OtherScalar(), new ObjectProvider(),new CatchAll()]
}


var iterateProviders = function (providers: IPropertyGroupProvider[], props: PropertyDescription[], consumed: {}) {
    providers.forEach(x=> {
        props.forEach(y=> {
            if (!consumed.hasOwnProperty(y.id)) {
                var r = x.consumeProperty(y);
                if (r) {
                    consumed[y.id] = true;
                }
            }
        })
    })
};
declare class Map<K,V> {
    set(k: K, v: V)

    has(k: K): boolean

    get(k: K): V

    delete(k: K): boolean
}

var processKw = function (kv: string[], map: Map<string, PropertyGroup[]>, x) {
    kv.forEach(w=> {
        if (!map.has(w)) {
            map.set(w, []);
        }
        var pg = map.get(w);
        if (pg.indexOf(x) == -1) {
            map.get(w).push(x);
        }
    })
};
export function collapseInner(g: PropertyGroup) {
    if (g.properties.length == 1) {
        if (g.properties[0].children && g.properties[0].children.length == 1) {
            if (!g.properties[0].map && !g.properties[0].array) {
                var tc = deepCopy(g.properties[0].children[0]);
                if (tc.map) {
                    tc.displayName = g.properties[0].displayName;
                    tc.id=g.properties[0].id + "=>" + tc.id + "</p>";
                    tc.description = g.properties[0].description + "<p>" + tc.description + "</p>";
                    g.properties = [tc];
                }
            }
        }
    }
}

declare var $: any

function deepCopy(obj: any) {
    var newObj = $.extend(true, {}, obj);
    return newObj;
}
export function collapseInnerProps(g: PropertyDescription) {
    if (g.children&&g.children.length == 1) {

        if (g.children[0].map|| g.children[0].array) {
            var tc = deepCopy(g.children[0]);
            if (tc.map) {
                tc.displayName = g.displayName;
                tc.id=g.id+"=>"+tc.id;
                tc.description = g.description + "<p>" + tc.description + "</p>";
                return tc;
            }
        }

    }
    return g;
}
function tryMerge(g: PropertyGroup[]): PropertyGroup[] {
    g=g.filter(x=>x.properties.length>0)
    var map = new Map<string,PropertyGroup[]>();
    g.forEach(gr=> {
        collapseInner(gr)
    })
    var keys: any = {};
    g.forEach(x=> {
        var kv = keywords.keywords(x.caption, false);
        kv.forEach(w=>keys[w] = 1);
        processKw(kv, map, x);
        x.properties.forEach(p=> {
            var ww = keywords.keywords(p.displayName, false);
            processKw(ww, map, x);
            ww.forEach(w=>keys[w] = 1);
        })
    })
    Object.keys(keys).forEach(key=> {
        var groups: PropertyGroup[] = map.get(key);
        if (groups.length > 1) {
            var toMerge: PropertyGroup[] = [];
            var toRemove: PropertyGroup[] = [];
            groups.forEach(g=> {
                if (g.properties.length <= 1) {
                    toRemove.push(g);
                }
                else {
                    if (g.properties.length < 5) {
                        toMerge.push(g);
                    }
                }
            });
            if (toRemove.length > 0 && toMerge.length > 0) {
                toRemove.forEach(x=>{
                    toMerge[0].properties=toMerge[0].properties.concat(x.properties);
                    g=g.filter(y=>y!=x);
                })
            }
        }
    })
    return g;
}

export var groupProps = function (props: PropertyDescription[]) {
    var providers = createProviders();
    var consumed: {[name: string]: boolean} = {};
    iterateProviders(providers, props, consumed);
    var result: PropertyGroup[] = [];
    providers.forEach(x=>result = result.concat(x.getResult()));
    result = tryMerge(result);
    return result;
};