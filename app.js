//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));



const mongoLocalURL = "mongodb://localhost:27017/";

//' Connect To MongoDB With New/Existing DB Named As 'todolistDB'
//' For Local MongoDB URL "mongodb://localhost:27017/todolistDB"
mongoose.connect(mongoLocalURL +"todolistDB",{
    useNewUrlParser: true, 
    useUnifiedTopology:true,
    useFindAndModify: false
});

//' Schema For ToDo Items 
const itemsSchema = {
    name: String
};

//Create Model Based On Schema
const Item = mongoose.model("Item", itemsSchema);

// Create New MongoDb Document 
const item1 = new Item({ name: "Welcome to todolist!" });
const item2 = new Item({ name: "Hit the + button to add new item." });
const item3 = new Item({ name: "<-- Check this to delete/complte a task." });

const defalutItems = [item1, item2, item3];



//' Custome New List Schema
const listSchema = {
    name: String,
    items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);





//' Defalut GET
app.get("/", (req, res)=>{    
    //' Find Added Existing Custome List
    Item.find({}, (err, foundItems)=>{
        //'console.log(foundItems);
        if(foundItems.length === 0){
            Item.insertMany(defalutItems, (err)=>{
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Saved Initial Items Data To MongoDb");
                }
            }); 
            res.redirect("/");
        }
        else{
            //' Create 
            res.render("list", { listTitle: "Today", newListItem: foundItems });
        }
    });    
    
});



//' Create Custome List
app.get("/:customeListParam", (req, res)=>{
    const customeListParam = _.capitalize(req.params.customeListParam);
    console.log(customeListParam);

    //' Check IF List Already Exists

    List.findOne({name: customeListParam}, (err, foundList)=>{
        if(!err){    
            //'console.log(foundList);       
            if(!foundList){
                //' Create New List
                const list = new List({
                    name: customeListParam,
                    items: defalutItems
                });            
                list.save();
                console.log("Creating New List");

                res.redirect("/"+customeListParam);

            }
            else{
                //' Show Existing List
                res.render("list", { 
                    listTitle: foundList.name, newListItem: foundList.items 
                });
            }
        }
        else{
            console.log(err);            
        }

    });    


});



//' POST : Add New ToDo Item To DB
app.post("/",(req, res)=>{    
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    //' Add To Default Home List
    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        //' Add To New Custome List & Redirect
        List.findOne({name: listName}, (err, foundList)=>{
            if(!err){
                if(foundList){
                    foundList.items.push(item);
                    foundList.save();

                    res.redirect("/" + listName);
                }
            }
            else{ console.log("Error On New List Add Item. "+err);}
            

        });
    }
});


//' DELETE Route
app.post("/delete", (req, res)=>{
    const checkedItemId = req.body.checkbox;
    const listName = req.body.ListName;
    console.log("checkedItemId: "+checkedItemId);

    //' Check For Defalut Home/Today List
    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, (err)=>{
            if(err){
                console.log(err);
            }
            else{
                console.log("Deleted Item With Id :"+checkedItemId);
                res.redirect("/");
            }
        
        });
    }
    else{
        //' Delete Item For Custom Created List
        //' To Delete, we are pulling/removing and item from items[] array
        List.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id: checkedItemId}}},
            {returnOriginal: true},
            (err, foundList)=>{                
                if(!err){
                    if(foundList){                     
                        const deletedEle = foundList.items.find((ele)=>{                       
                            return ele._id == checkedItemId;
                        })
                        console.log("Item Deleted : '"+deletedEle.name+"' from List: '"+listName+"'");                   
                        
                        //' Redirect To Page
                       res.redirect("/" + listName);
                    }
                }
                else{ 
                    console.log("Error While Deleting Item Form Custome List. "+err);
                }

            }
        );
    }
    



});



//' "/work" ROUTE
//' GET 
app.get("/work", (req, res)=>{
    res.render("list", { listTitle: "Work List", newListItem: workItems });
});

//' POST
app.post("/work", (req, res)=>{
    const item = req.body.newItem;
    workItems.push(item);    
    res.redirect("/work");
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, ()=>{
    console.log("Server Started At Port: "+port);
});
