import {TreeView} from "./workbench";
import forms=require("./forms")
import controls=require("./controls")
import tps=require("raml-type-bindings")
import  workbench=require("./workbench")
import display=require("./uifactory")
class DemoView extends workbench.TreeView{}
class Details extends workbench.ViewPart{

    input:any

    innerRender(c:HTMLElement){
        c.innerHTML="";
        if (this.input) {
            var tp = this.input.editType;
            var control = display.service.createControl(tps.binding({}, tp), this.input.renderingOptions);
            control.render(c);
        }
    }

    setInput(i:any){
        this.input=i
        this.refresh();
    }
}
declare var $:any;
declare var hljs:any;
class SourceType extends workbench.ViewPart{

    input:any

    innerRender(c:HTMLElement){
        c.innerHTML="";
        if (this.input) {
            var res=new controls.HorizontalTabFolder();
            var sc=new controls.SourceCode();
            sc.setTitle("Source Type")
            sc.setLanguage("JSON")
            sc.setContent(JSON.stringify(this.input.editType,null,2));
            res.add(sc);
            var sc=new controls.SourceCode();
            sc.setTitle("Rendering options")
            sc.setContent(JSON.stringify(this.input.renderingOptions,null,2));
            res.add(sc);
            res.render(c);
        }
        else{
        }
    }

    setInput(i:any){
        this.input=i
        this.refresh();
    }
}

const Example:tps.ObjectType&tps.metakeys.GroupBy={
    id:"Example",
    type:tps.TYPE_OBJECT,
    properties:{
        name: tps.TYPE_STRING,
        description:tps.TYPE_STRING,
        editType: tps.TYPE_OBJECT,
        category: tps.TYPE_STRING
    },
    defaultGroupBy:"category"
}
interface IExample{
    name: string
    description:string
    editType: any,
    renderingOptions: any,
    category: string
}
const SimplePerson:IExample={
    name: "Person Example",
    description:"Simple Form",
    editType:{
        id:"Person",
        type:"object",
        properties:{
            name: {
                type: "string",
                description:"Please add first name here"
            },
            lastName: "string",
            married: "boolean",
            hasChildren: {
                type: "boolean",
                disabledWhen:"!$.married"
            },
            age:{ type: "number", minimum:1, maximum: 100},
            /// this is some validation
            partnerFullName:{
                type: "string",
                visibleWhen:"$.married"
            },
            divorceReason:{ type:"string",requiredWhen:"$.divorced",visibleWhen:"$.divorced",requiredWhenMessage:"Divorse reason should be specified"},
            divorced: "boolean",
            single:{ type: "boolean", default:true}
        },
        required:["name","lastName"],
        propOrder:["name","lastName","age","single"]
    },
    renderingOptions:{

    },
    category:"Forms"
}

const Enums:IExample={
    name: "Enum Descriptions Example",
    description:"Enum example",
    editType:{
        id:"Vehicle",
        type:"object",
        properties:{
            name: "string",
            propulsion:{
                type: "integer",
                enum:[1,2,3,4],
                enumDescriptions:["wind","coal","oil","hydrogen"],
                description:"Describe source of energy for you vehicle engine",
                    required: true
            }
        }
    },
    renderingOptions:{

    },
    category:"Forms"
}
const TypeAheadExample:IExample={
    name: "Input intellisense",
    description:"Type ahead example",
    editType:{
        id:"Vehicle",
        type:"object",

        properties:{
            name: {
                type: "string",
                typeahead:"$.commonNames"
            },
            commonNames:{
                type: "array",
                itemType:{
                    type: "string"
                },
                default:["Pavel","Denis","Max"]
            }
        }
    },
    renderingOptions:{

    },
    category:"Forms"
}
const StringArray:IExample={
    name: "Group",
    description:"Group",
    editType:{
        id:"Group",
        type:"object",
        properties:{
            name: { type:"string",required:true},
            members:{
                type: {
                    type:"array",
                    itemType:{
                        type: "string",
                        minLength: 1
                    }
                },
                default:["A","B","C"]
            },
            leader:{
              type:"string",
              enumValues:"$.members",
              required: true
            }
        }
    },
    renderingOptions:{

    },
    category:"Forms"
}
const StringMap:IExample={
    name: "Group (Map)",
    description:"Group",
    editType:{
        id:"Group",
        type:"object",
        properties:{
            name: { type:"string",required:true},
            members:{
                type: {
                    type:"map",
                    componentType:{
                        type: "string",
                        displayName:"Class",
                        enum:["Warrior","Mage","Priest","Ranger"]
                    }
                },
            },
            leader:{
                type:"string",
                enumValues:"$.members",
                required: true
            }
        }
    },
    renderingOptions:{

    },
    category:"Forms"
}
const Issue:IExample={
    name: "Issue",
    description:"Group",
    editType:{
        id:"Issue",
        type:"object",
        properties:{
            title: { type:"string",required:true},
            content: { type:"string",required:true,multiline:"true"},
            assignees:{
                type: {
                    type:"array",
                    itemType:{
                        type: "string",
                        minLength: 1
                    }
                }
            },
            labels:{
                type: {
                    type:"array",
                    itemType:{
                        type: "string",
                        minLength: 1
                    }
                }
            },
            milestone:{
                type:"string",
                enumValues:"$.members",
                required: true
            }
        }
    },
    renderingOptions:{

    },
    category:"Forms"
}


var examples=[
    SimplePerson,
    Enums,
    TypeAheadExample,
    StringArray,
    StringMap,
    Issue
]

var dv=new DemoView("List of Demos","Demo")
dv.setInput(examples)
dv.setLabelProvider({

    label(a:any){
        return a.name;
    }
})
var details=new Details("Example","Example")
var source=new SourceType("Source","Source")
dv.addSelectionConsumer(details)
dv.addSelectionConsumer(source)
var demoPerspective={
    title:"Demo",

    actions:[
    ],

    views:[
        {view:details,ref:"*",ratio:100,relation:workbench.Relation.LEFT},
        {view:dv,ref:"Example",ratio:15,relation:workbench.Relation.LEFT},
        {view:source,ref:"Example",ratio:40,relation:workbench.Relation.BOTTOM},
    ]
}
workbench.defaultNavBar.brandRight="";
var app=new workbench.Application("Types UI Demo",demoPerspective,"app",demoPerspective);