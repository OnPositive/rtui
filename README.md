#Types UI

Little has changed in the business application UI development since ... release. 

Technologies have changed (GXT, Angular, React, etc.), but fundamentals remain the same.  The developer must choose which components to use, how to lay those components out, how to store the data being edited and how to synchronize the model with the UI. Even the best developers fall into traps of having UI components talk directly to other UI components rather than through the model. Inordinate amount of time is spent debugging layout and data-binding issues.



Types UI aims to raise UI writing to a higher level of abstraction. The core premise is that the basic building block of UI should not be a UI component, but rather a property editor. 

Unlike a component, a property editor analyzes metadata associated with a given property, renders the appropriate widgets to edit that property and wires up data binding. Data is synchronized, validation is passed from the model to the UI, content assistance is made available, etc.



This fundamentally changes the way developers interact with a UI framework. Instead of writing UI by telling the system how to do something, the developer tells the system what they intend to accomplish. When using Types UI, the developer says "I want to edit LastName property of the person object”. 

When using widget toolkits like GXT, the developer says "create label, create text box, lay them out like so, configure their settings, setup data binding and so on". By the time the developer is done, it is hard to see the original goal in the code that's produced. This results in UI that is inconsistent, brittle and difficult to maintain.

##First, The Model

Describe semantics of the data that UI will edit using RAML annotations



##Layer Models


Combine information from multiple models into an integrated model. Bring together information from many files.



##Stuff to Forget About


Start making a list of stuff that you can now forget about...
Creating and laying out widgets.
listeners, events and how not to end up in an infinite loop.
data binding
etc…


##Other UI Toolkits

Currently only Bootstrap presentation is available, but Types UI definitions are not tied to a particular toolkit. Other presentations such as React, GXT, Vaadin are possible in the future either from this project directly or from adopters.


##Next, The UI

Describe how to present the model in UI in via a simple YAML file and let Types UI handle the rest. Embed Types UI anywhere you can create an HTML Element.
