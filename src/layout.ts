
import {AbstractComposite, Composite, HorizontalFlex, VerticalFlex} from "./controls";
import {Section} from "./forms";
interface ILayoutData{
    grabHorizontal?:boolean
    grabVertical?:boolean
    hasMinimalHeight:boolean
}


export function adjustLayout(c:Composite){

    c.children.forEach(x=>{
        if (x instanceof Composite){
            adjustLayout(x);
        }
    })
    if (!c.parent){

    }

    // if (c.parent instanceof VerticalFlex){
    //     //c._style.padding="5px";
    //     c._style.marginTop="5px";
    // }
}