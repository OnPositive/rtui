#Single page applications

Types UI contains basic infrastructure which may be used to facilitate single 
page application development.

###Perspective Management

A perspective defines the initial set and layout of views in the Application. Within the application, 
each perspective shares the same set of views/editors.
Each perspective provides a set of functionality aimed at accomplishing a specific type of task or works with 
specific types of resources. 


```javascript
var demoPerspective = {
    views: [
        {view: details, ref: "*", ratio: 100, relation: RC.Relation.LEFT},
        {view: list, ref: "Example", ratio: 15, relation: RC.Relation.LEFT},
        {view: source, ref: "Example", ratio: 40, relation: RC.Relation.BOTTOM},
    ]
}
```

###Views


###Editors