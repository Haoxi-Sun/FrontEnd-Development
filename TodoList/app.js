const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"))
mongoose.connect("mongodb+srv://admin-elsie:Test123@cluster0.19uvg.mongodb.net/todolistDB");

const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  name : "Homework"
});
const item2 = new Item({
  name : "Hit the + button to add a new item."
});
const item3 = new Item({
  name : "<-- Hit this to delete an item."
});

const listSchema = {
  name : String,
  items : [itemSchema]
}
const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res){
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        }else{
          console.log("Inserted Successfully!");
        }
        res.redirect("/");
      });
    }else{
      res.render('list', {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name : customListName},function(err, result){
    if(!err){
      if(!result){
        const list = new List({
          name : customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        res.render("list", {listTitle: result.name, newListItems: result.items})
      }
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.button;

  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name : listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }

});

app.post("/delete", function(req, res){
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  }else{
      List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}}, function(err, foundList){
        if(!err){
          res.redirect("/"+listName);
        }
      });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function(){
  console.log("Server started on port " + port);
});
