import {TreeView} from "./workbench";
import forms=require("./forms")
import controls=require("./controls")
import tps=require("raml-type-bindings")
import  workbench=require("./workbench")
import display=require("./uifactory")
class DemoView extends workbench.TreeView {}

class Details extends workbench.ViewPart {

    input: any

    innerRender(c: HTMLElement) {
        c.innerHTML = "";
        if (this.input) {
            var tp = this.input.editType;
            var bnd = tps.binding({}, tp);
            if (this.input.collections) {
                Object.keys(this.input.collections).forEach(x => {
                    bnd.addVar(x, this.input.collections[x]);
                })
            }
            var control = display.service.createControl(bnd, this.input.renderingOptions);
            control.render(c);
        }
    }

    constructor(t:string,i:string){
        super(t,i);
    }

    setInput(i: any) {
        this.input = i
        this.refresh();
    }
}
declare var $: any;
declare var hljs: any;
class SourceType extends workbench.ViewPart {

    input: any

    innerRender(c: HTMLElement) {
        c.innerHTML = "";
        if (this.input) {
            var res = new controls.HorizontalTabFolder("div");
            var sc = new controls.SourceCode();
            sc.setTitle("Source Type")
            sc.setLanguage("JSON")
            sc.setContent(JSON.stringify(this.input.editType, null, 2));
            res.add(sc);
            var sc = new controls.SourceCode();
            sc.setTitle("Rendering options")
            sc.setContent(JSON.stringify(this.input.renderingOptions, null, 2));
            res.add(sc);
            res.render(c);
        }
        else {
        }
    }

    setInput(i: any) {
        this.input = i
        this.refresh();
    }
}

const Example: tps.ObjectType&tps.metakeys.GroupBy = {
    id: "Example",
    type: tps.TYPE_OBJECT,
    properties: {
        name: tps.TYPE_STRING,
        description: tps.TYPE_STRING,
        editType: tps.TYPE_OBJECT,
        category: tps.TYPE_STRING
    },
    defaultGroupBy: "category"
}
interface IExample {
    name: string
    description: string
    editType: any,
    renderingOptions: any,
    category: string
    collections?: {
        [name: string]: any[]
    }
}
const SimplePerson: IExample = {
    name: "Person Example",
    description: "Simple Form",
    editType: {
        id: "Person",
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "Please add first name here"
            },
            lastName: "string",
            married: "boolean",
            hasChildren: {
                type: "boolean",
                disabledWhen: "!$.married"
            },
            age: {type: "number", minimum: 1, maximum: 100},
            /// this is some validation
            partnerFullName: {
                type: "string",
                visibleWhen: "$.married"
            },
            divorceReason: {
                type: "string",
                requiredWhen: "$.divorced",
                visibleWhen: "$.divorced",
                requiredWhenMessage: "Divorse reason should be specified"
            },
            divorced: "boolean",
            single: {type: "boolean", default: true}
        },
        required: ["name", "lastName"],
        propOrder: ["name", "lastName", "age", "single"]
    },
    renderingOptions: {},
    category: "Forms"
}

const Enums: IExample = {
    name: "Enum Descriptions Example",
    description: "Enum example",
    editType: {
        id: "Vehicle",
        type: "object",
        properties: {
            name: "string",
            propulsion: {
                type: "integer",
                enum: [1, 2, 3, 4],
                enumDescriptions: ["wind", "coal", "oil", "hydrogen"],
                description: "Describe source of energy for you vehicle engine",
                required: true
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const TypeAheadExample: IExample = {
    name: "Input intellisense",
    description: "Type ahead example",
    editType: {
        id: "Vehicle",
        type: "object",

        properties: {
            name: {
                type: "string",
                typeahead: "$.commonNames"
            },
            commonNames: {
                type: "array",
                itemType: {
                    type: "string"
                },
                default: ["Pavel", "Denis", "Max"]
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const StringArray: IExample = {
    name: "Group",
    description: "Group",
    editType: {
        id: "Group",
        type: "object",
        properties: {
            name: {type: "string", required: true},
            members: {
                type: {
                    type: "array",
                    itemType: {
                        type: "string",
                        minLength: 1
                    }
                },
                default: ["A", "B", "C"]
            },
            leader: {
                type: "string",
                enumValues: "$.members",
                required: true
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const StringArrayUniqueItems: IExample = {
    name: "String Array(Unique items)",
    description: "Group",
    editType: {
        id: "Group",
        type: "object",
        properties: {
            name: {type: "string", required: true},
            members: {
                type: {
                    type: "array",
                    itemType: {
                        type: "string",
                        minLength: 1
                    },
                    uniqueItems:true
                },
                default: ["A", "B", "C"]
            },
            leader: {
                type: "string",
                enumValues: "$.members",
                required: true
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const ObjectArrayUniqueKeys: IExample = {
    name: "Object Array(Unique items)",
    description: "Group",
    editType: {
        id: "Group",
        type: "object",
        properties: {
            name: {type: "string", required: true},
            members: {
                type: {
                    type: "array",
                    itemType: {
                        type: "object",
                        properties:{
                            name:{
                                type: "string",
                                unique: true
                            },
                            x:"integer",
                            y:"integer"
                        }
                    },

                },

            },
            leader: {
                type: "string",
                enumValues: "$.members",
                required: true
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const StringMap: IExample = {
    name: "Group (Map)",
    description: "Group",
    editType: {
        id: "Group",
        type: "object",
        properties: {
            name: {type: "string", required: true},
            members: {
                type: {
                    type: "map",
                    componentType: {
                        type: "string",
                        displayName: "Class",
                        enum: ["Warrior", "Mage", "Priest", "Ranger"]
                    }
                },
            },
            leader: {
                type: "string",
                enumValues: "$.members",
                required: true
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const Issue: IExample = {
    name: "Issue",
    description: "Group",
    editType: {
        id: "Issue",
        type: "object",
        properties: {
            title: {type: "string", required: true},
            content: {type: "string", required: true, multiline: "true"},
            assignees: {
                type: {
                    type: "array",
                    itemType: {
                        type: "string",
                        minLength: 1,
                        enumValues: "@assignees",

                    },
                    uniqueItems: true
                }
            },
            labels: {
                type: {
                    type: "array",
                    itemType: {
                        type: "string",
                        minLength: 1,
                        enumValues: "@labels",

                    },
                    uniqueItems: true
                }
            },
            milestone: {
                type: "string",
                enumValues: "@milestones",
                required: true

            }
        }
    },
    collections: {
        milestones: ["M1", "M2", "M3", "M4", "M5"],
        labels: ["Bug", "Question", "Feature", "High", "Blocker"],
        assignees: ["Pavel", "Denis", "Mark", "Gleb"]
    },
    renderingOptions: {},
    category: "Forms"
}

const InnerType = {
    name: "Inner Type",
    description: "Group",
    editType: {
        id: "Issue (Inner object type)",
        type: "object",
        properties: {
            title: {type: "string", required: true},
            content: {type: "string", required: true, multiline: "true"},
            location: {
                type: "object",
                properties: {
                    x: {
                        type: "number",
                        required: true
                    },
                    y: "number"
                }
            },
            extraData: {
                type: "object",
                properties: {
                    "kind": "string",
                    "subKind": "string"
                }
            },
            "tags": {
                type: "array",
                itemType: "string"
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const SimpleUnion = {
    name: "Union Type(type or array of type)",
    description: "Group",
    editType: {
        id: "Issue (Inner object type)",
        type: "object",
        properties: {
            title: {type: "string", required: true},
            options: {
                type: "union",
                options: ["string",
                    {
                        type:"array",
                        itemType:"string"
                    }
                ]
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const SimpleUnion1 = {
    name: "Union Type(scalar)",
    description: "Group",
    editType: {
        id: "Issue (Inner object type)",
        type: "object",
        properties: {
            title: {type: "string", required: true},
            options: {
                type: "union",
                options: ["string","number"]
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const Thing={
    type:"object",
    id:"thing",
    properties:{
        kind:"string",
        name: "string",
        owned: "boolean"
    },
    discriminator:"kind",
    required: ["name","kind"]
}
const Animal={
    type:Thing,
    id:"animal",
    properties:{
        kind:"string",
        food: { type:"string",required: true}
    },
    discriminator:"kind"
}
const Vehicle={
    type:Thing,
    id:"vehicle",
    properties:{
        fuel: "string",
        maxSpeed:{ type:"number",required: true}
    },
    discriminator:"kind"
}
const VehicleOrAnimal={
    type:"union",
    options: [Vehicle,Animal]
}

const SimpleUnion2= {
    name: "Union Type (object)",
    description: "Group",
    editType: VehicleOrAnimal,
    renderingOptions: {},
    category: "Forms"
}
const SimpleUnion3= {
    name: "Array of unions",
    description: "Group",
    editType: {
        id: "Issue (Inner object type)",
        type: "object",
        properties: {
            title: {type: "string", required: true},
            options: {
                type: "array",
                itemType: {
                    type:"union",
                    options: ["string", "number"]
                }
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const SimpleUnion4= {
    name: "Union of arrays",
    description: "Group",
    editType: {
        id: "Issue (Inner object type)",
        type: "object",
        properties: {
            title: {type: "string", required: true},
            options: {
                type: "union",
                options:[
                    {
                        type: "array",
                        itemType:"string"
                    }
                    ,{
                        type: "array",
                        itemType:"number"
                    }
                ]
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}

const attrType = {
    type: "number",
    minimum: 1,
    maximum: 5,
    required: false,
    default: 2
}
const skillType = {
    type: "number",
    minimum: 0,
    maximum: 5,
    required: false,
    default: 0
}


const groupType={
    type: "integer",
    instanceValidator:"this==6||this==8||this==10",
    errorMessage:"${displayName} group sum should be 6, 8 or 10"
}


const Party = {
    name: "Party of characters",
    description: "Group",
    editType: {
        id: "Issue (Inner object type)",
        type: "object",

        properties: {
            name: {type: "string", required: true},

            characters: {
                type: "array",
                itemType: {
                    type: "object",
                    properties: {
                        name: {type: "string", required: true, unique: true},
                        concept: "string",

                        cabal: "string",
                        essense: "string",
                        strengh: attrType,
                        dexterity: attrType,
                        stamina: attrType,
                        physical:{
                            type: groupType,
                            computeFunction:"this.dexterity+this.stamina+this.strengh",
                        },

                        charisma: attrType,
                        manipulation: attrType,
                        appearance: attrType,

                        social:{
                            type: groupType,
                            computeFunction:"this.charisma+this.manipulation+this.appearance"
                        },

                        perception: attrType,
                        intelligence: attrType,
                        width: attrType,

                        mental:{
                            type: groupType,
                            computeFunction:"this.perception+this.intelligence+this.width"
                        },
                        talents:{
                            type: "map",
                            keyType:{
                                type:"string",
                                enum: ["Brawl","Dodge","Expression","Intimidation","Leadership","Alerness","Awareness"]
                            },
                            componentType: skillType
                        },
                        knowledges:{
                            type: "map",
                            componentType: skillType
                        },
                        skills:{
                            type: "map",
                            componentType: skillType
                        },
                        backgrounds:{
                            type: "map",
                            description:"Additional backgrounds of the character",
                            componentType: skillType
                        },
                        totalAttrs:{
                            type: "integer",
                            instanceValidator:"this==(6+8+10)",
                            errorMessage:"Attribute groups should have 6,8,10 points spent",
                            computeFunction:"this.physical+this.social+this.mental",
                        },
                    },
                    propertyGroups: {
                        "Physical Attributes": ["strengh", "dexterity", "stamina","physical"],
                        "Social Attributes": ["charisma", "appearance", "manipulation","social"],
                        "Mental Attributes": ["perception","intelligence","width","mental"]
                    },
                    hiddenProperties:["totalAttrs"]
                }
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}


const Types = {
    name: "Types Library",
    description: "Group",
    editType: {
        id: "Issue (Inner object type)",
        type: "object",

        properties: {
            name: {type: "string", required: true},
            types: {
                type: "map",
                componentType: {
                    type: "object",
                    properties: {
                        description: { type: "string", required: true},
                        superTypes:{
                            type:"array",
                            itemType: "string"
                        },
                        properties:{
                            type: "map",
                            componentType:{ type:"string", displayName:"Type"}
                        }
                    },
                }
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
const Github = {
    name: "Github",
    description: "Group",
    editType: {
        id: "Issue (Inner object type)",
        type: "object",
        properties: {
            //name: "string",
            issues:{
                type: "relation",

                location:"https://api.github.com/search/issues?q=RAML&sort=updated",
                paging: true,
                pageNumberPointer:"page",
                results:"items",
                total:"total_count",
                errorIn:"message",

                itemType:{
                    type: "object",
                    icon:"https://maxcdn.icons8.com/office/PNG/16/Animals/bug-16.png",
                    properties:{
                        title: "string",
                        repository_url:"string",
                        labels:"string",
                        created_at:"date",
                        updated_at:"date",
                        comments:"integer",
                        body:"markdown",
                        comments_url:{
                            type:"relation",
                            displayName:"Comments",
                            errorIn:"message",
                            itemType:{
                                type:"object",
                                icon:"https://maxcdn.icons8.com/Color/PNG/24/Business/comments-24.png",
                                properties:{

                                    created_at: "date",
                                    updated_at: "date",
                                    body:"markdown",
                                    user:{
                                        type:"object",
                                        properties:{
                                            login: "string",
                                            avatar_url:"string"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    propertyGroups:{
                      "Body":["body"],
                      "Comments":["comments_url"],
                    }
                },
                columns:["title","comments","created_at","updated_at"]
            }
        }
    },
    renderingOptions: {},
    category: "Forms"
}
var examples = [
    SimplePerson,
    Enums,
    TypeAheadExample,
    StringArray,
    StringMap,
    StringArrayUniqueItems,
    ObjectArrayUniqueKeys,
    SimpleUnion,
    SimpleUnion1,
    SimpleUnion2,
    SimpleUnion3,
    SimpleUnion4,
    Issue,
    InnerType,
    Party,
    Types,
    Github
]

var dv = new DemoView("List of Demos", "Demo")
dv.setInput(examples)
dv.setLabelProvider({

    label(a: any){
        return `<img src="https://maxcdn.icons8.com/Color/PNG/24/Travel/mess_tin-24.png"></img>`+a.name;
    }
})
var details = new Details("Example", "Example")
var source = new SourceType("Source", "Source")
dv.addSelectionConsumer(details)
dv.addSelectionConsumer(source)
var demoPerspective = {
    title: "Demo",

    actions: [],

    views: [
        {view: details, ref: "*", ratio: 100, relation: workbench.Relation.LEFT},
        {view: dv, ref: "Example", ratio: 15, relation: workbench.Relation.LEFT},
        {view: source, ref: "Example", ratio: 40, relation: workbench.Relation.BOTTOM},
    ]
}
workbench.defaultNavBar.brandRight = "";
var app = new workbench.Application("Types UI Demo", demoPerspective, "app", demoPerspective);