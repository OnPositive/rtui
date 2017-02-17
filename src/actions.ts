
import tp= require("raml-type-bindings");
import {IContributionItem, IListanableItem} from "./controls";
import {IBinding, Binding, IValueListener, ChangeEvent, Status} from "raml-type-bindings";
import wb=require("./workbench")
import uf=require("./uifactory")
import ctrls=require("./controls")
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
    protected selection:IBinding;
    constructor(protected _valBinding:IBinding){
        super(_valBinding.collectionBinding().selectionBinding());
        this.selection=_valBinding.collectionBinding().selectionBinding();
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
        nn.context=this.selection;
        nn.value=ni;
        nn._type=tp.service.resolvedType(<any>{
            id:"",
            //displayName:this.selection.type().displayName,
            required: true,
            type: sr,
            uniquinessException:{}
        });
        var v=this;
        dialog("Create "+sr.displayName,nn,()=>{
            v._valBinding.add(nn.get());
        });
    }
}

export class CreateWithConstructorAction extends CollectionAction{

    title: string


    constructor(protected _valBinding:IBinding,private _constructor:tp.Operation){
        super(_valBinding)
    }

    defaultTitle(){
        return "Create";
    }
    isEnabled(){
        return true;
    }
    run(){
        var nn=new tp.OperationBinding(this._constructor,<tp.Binding>this._valBinding);
        var v=this;
        dialog(tp.service.caption(nn.type()),nn,()=>{
            nn.execute(
                (x:any)=>{
                    if (x) {
                        v._valBinding.add(x);
                    }
                    else{
                        v._valBinding.refresh();
                    }
                }
            );

        });
    }
}
export class SetBindingValueAction implements IContributionItem,tp.IValueListener{

    title: string
    checked: boolean

    constructor(private b:Binding,private val: any,label?:string){
        this.title=tp.service.label(val,b.type());
        if (label){
            this.title=label;
        }
        this.valueChanged(null);
        b.addPrecomitListener(this);
    }

    valueChanged(e){
        this.checked=this.b.get()==this.val||(!this.b.get()&&this.val==this.b.type().default);
    }

    run(){

        this.b.set(this.val);
        this.valueChanged(null)
    }
}
export class ValuesMenu implements IContributionItem{

    title: string
    items:IContributionItem[];
    bnd: Binding
    transform:(x:any)=>any
    constructor(private b:Binding){
        this.title=tp.service.caption(b.type());
        var en=tp.enumOptions(b.type(),b);
        if (!en||en.length==0){
            var bnd=tp.enumOptionsBinding(b.type(),b);
            if (bnd) {
                this.bnd=bnd.collection;
                bnd.collection.addListener(this)
                this.valueChanged(null);
                this.transform=bnd.transformer
            }
        }
        else {
            this.items = en.map(x => new SetBindingValueAction(b, x));
        }
    }
    valueChanged(e){
        if (this.bnd) {
            this.items = this.bnd.collectionBinding().workingCopy().map(x => new SetBindingValueAction(this.b, this.transform?this.transform(x):x,tp.service.label(x,this.bnd.collectionBinding().componentType())));
            if (!this.bnd.type().required){
                this.items.push(new SetBindingValueAction(this.b,null,"None"))//
            }
        }
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
        nn.context=this.selection;
        nn.value=tp.service.workingCopy(this.selection.get(),this.selection.type());
        nn._type=tp.service.resolvedType(<any>{
            id:"",
            required: true,
            uniquinessException:this.selection.get(),
            type: this.selection.type()
        });
        var v=this;
        dialog("Edit "+sr.displayName,nn,()=>{
                    v._valBinding.replace(v.selection.get(),nn.get());
                    // v.selection.readonly=false
                    // v.selection.set(nn.get());
                    // v.selection.readonly=true
                });
    }
}
export class CommitValidAction extends BindingDependentAction implements IValueListener{

    title: string
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
    wb.showInDialog(caption,uf.service.createControl(b,{dialog:true,maxMasterDetailsLevel:0}),[
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