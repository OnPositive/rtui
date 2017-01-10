
import tp= require("raml-type-bindings");
import {IContributionItem, IListanableItem} from "./controls";
import {IBinding, Binding, IValueListener, ChangeEvent, Status} from "raml-type-bindings";
import wb=require("./workbench")
import uf=require("./uifactory")

export abstract class ListenableAction implements IListanableItem{

    private listeners:IValueListener[]=[];


    addListener(v: IValueListener){
        if (this.listeners.length==0){
            this.startListening();
        }
        this.listeners.push(v);
    }
    startListening(){

    }
    stopListening(){

    }
    removeListener(v: IValueListener){
        this.listeners=this.listeners.filter(x=>x!=v);
        if (this.listeners.length==0){
            this.stopListening();
        }
    }

    fireChanged(){
        var e:ChangeEvent={
            source: null,
            target: this,
            oldValue:null,
            newValue:null,
            kind: "changed"
        }
        this.listeners.forEach(l=>l.valueChanged(e));
    }
}
export abstract class BindingDependentAction extends ListenableAction implements IValueListener{

    disabled:boolean

    constructor(protected depBnd:IBinding){
        super();
        this.disabled=!this.isEnabled();
    }

    abstract isEnabled():boolean

    valueChanged(e:ChangeEvent){
        var ds=!this.isEnabled();
        if (ds!=this.disabled){
            this.disabled=ds;
            this.fireChanged();
        }
    }
    startListening(){
        this.depBnd.addListener(this);
    }
    stopListening(){
        this.depBnd.removeListener(this);
    }
}

export abstract class CollectionAction extends  BindingDependentAction implements IContributionItem{

    title:string

    constructor(protected _valBinding:IBinding,protected selection:IBinding){
        super(selection)
        this.title=this.defaultTitle();
    }
    run(){

    }

    protected abstract defaultTitle()
}
const Cancel={
    title:"Cancel",
    run(){}
}
export class CreateAction extends CollectionAction{

    title: string


    defaultTitle(){
        return "Create";
    }
    isEnabled(){
        return true;
    }
    run(){
        var sr=tp.service.resolvedType(this.selection.type());
        var ni=tp.service.newInstance(this.selection.type())
        var nn=new tp.Binding("");
        nn.value=ni;
        nn._type=tp.service.resolvedType({
            id:"",
            required: true,
            type: this.selection.type()
        });
        var v=this;
        dialog("Create "+sr.displayName,nn,()=>{
            v._valBinding.add(nn.get());
        });
    }
}


export class EditAction extends CollectionAction{


    defaultTitle(){
        return "Edit";
    }
    isEnabled(){
        return this.depBnd.get()!==undefined&&this.depBnd.get()!==null;
    }

    run(){
        var sr=tp.service.resolvedType(this.selection.type());
        var ni=tp.service.newInstance(this.selection.type())
        var nn=new tp.Binding("");
        nn.value=tp.service.workingCopy(this.selection.get(),this.selection.type());
        nn._type=tp.service.resolvedType({
            id:"",
            required: true,
            type: this.selection.type()
        });
        var v=this;
        dialog("Edit "+sr.displayName,nn,()=>{
                    v._valBinding.replace(v.selection.get(),nn.get());
                });
    }
}
export class CommitValidAction extends BindingDependentAction implements IValueListener{

    title: string
    disabled: boolean=false;
    primary: boolean

    constructor(private  b: Binding,private onOk:()=>void){
        super(b.binding("$status"));
        this.title="Ok";
        this.primary=true;

    }
    isEnabled(){
        var st:Status=this.depBnd.get();
        return st.valid;
    }
    run(){
        this.onOk();
    }

}

export function dialog(caption: string,b:Binding,onOk:()=>void){
    wb.showInDialog(caption,uf.service.createControl(b,{dialog:true}),[
        new CommitValidAction(b,onOk),
        Cancel,
    ])
}

export class DeleteAction extends CollectionAction{

    isEnabled(){
        return this.depBnd.get()!==undefined&&this.depBnd.get()!==null;
    }
    run(){
        this._valBinding.remove(this.selection.get());
    }
    defaultTitle(){
        return "Remove";
    }
}