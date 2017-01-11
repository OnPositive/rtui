import {TreeView} from "./workbench";
import forms=require("./forms")
import controls=require("./controls")
import tps=require("raml-type-bindings")
import  workbench=require("./workbench")
import display=require("./uifactory")
class DemoView extends workbench.TreeView {
}
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
const attrType = {
    type: "number",
    minimum: 1,
    maximum: 5,
    required: false,
    default: 1
}
const skillType = {
    type: "number",
    minimum: 0,
    maximum: 5,
    required: false,
    default: 0
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
                        name: {type: "string", required: true},
                        concept: "string",

                        cabal: "string",
                        essense: "string",

                        strengh: attrType,
                        dexterity: attrType,
                        stamina: attrType,
                        physical:{
                            type: "integer",
                            computeFunction:"this.dexterity+this.stamina+this.strengh"
                        },

                        charisma: attrType,
                        manipulation: attrType,
                        appearance: attrType,

                        social:{
                            type: "integer",
                            computeFunction:"this.charisma+this.manipulation+this.appearance"
                        },

                        perception: attrType,
                        intelligence: attrType,
                        width: attrType,

                        mental:{
                            type: "integer",
                            computeFunction:"this.perception+this.intelligence+this.width"
                        },
                        talents:{
                            type: "map",
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
                            componentType: skillType
                        },
                        totalAttrs:{
                            type: "integer",
                            computeFunction:"this.physical+this.social+this.mental"
                        },
                    },
                    propertyGroups: {
                        "Physical Attributes": ["strengh", "dexterity", "stamina","physical"],
                        "Social Attributes": ["charisma", "appearance", "manipulation","social"],
                        "Mental Attributes": ["perception","intelligence","width","mental"]
                    }
                }
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
    Issue,
    InnerType,
    Party
]

var dv = new DemoView("List of Demos", "Demo")
dv.setInput(examples)
dv.setLabelProvider({

    label(a: any){
        return a.name;
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