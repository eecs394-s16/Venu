// ui stuff ------------------------------------------------------------------------------------

// refs
addr = function(feature){
  return "https://square1.firebaseio.com/" + String(UID) + "/" + feature + "/";
}

// globalref for user authentication
var globalref = new Firebase("https://square1.firebaseio.com/");
// Register the callback to be fired every time auth state changes
globalref.onAuth(authDataCallback);
// Create a callback which logs the current auth state
var UID = -1;
function authDataCallback(authData) {
  if (authData) {
    // logged in, already in index so stay here
    // get uid
    UID = authData.uid;
    // load("dash");
    load("orders");
  }
  else {
    // not logged in, go to splash to log in
    window.location = "splash.html";
  }
}
// also check manually at page load
authDataCallback(globalref.getAuth());

// loads pages by redrawing page-wrapper DOM
function load(id) {
  switch(id) {
    case "dash":
      $("#page-wrapper").load('pages/dash.html', function(data) {
        $('#inventory-panel').load('pages/inventory-widget.html', function(){
          $('#orders-panel').load('pages/orders-widget.html', function(){
            loadFirebase(id);
          });
        });
      });
      break;
    case "inventory":
      $('#page-wrapper').load('pages/inventory.html', function(data){
        loadFirebase(id);

      });
      break;
          
    case "orders":
      jQuery.get('pages/orders.html', function(data) {
        document.getElementById("page-wrapper").innerHTML = data;
        loadFirebase(id);
    
      });
      break;
        
    case "tasks":
      $('#page-wrapper').load('pages/tasks.html', function(data){
          loadFirebase(id);
      });
      break;
          

    case "shipping":
      jQuery.get('pages/shipping.html', function(data) {
        document.getElementById("page-wrapper").innerHTML = data;
        loadFirebase(id);
      });
      break;
          
    default:
      console.log("got bad load id");
  }
}

// firebase stuff ------------------------------------------------------------------------------------

// loads firebase databases (multiple, one for each feature)
// creates listeners for rendering data, adding data, etc
// automatically runs on page load
// call again every time page is drawn (in function "load")
// read about js switches: http://www.w3schools.com/js/js_switch.asp
function loadFirebase(id){
  // only return the code for that page being loaded
  switch(id) {
    case "dash":
      // display bottlenecked stuff in widgets
      inventory_bottleneckLogic();
      orders_bottleneckLogic();
      break;
    case "inventory":
      var inventoryRef = new Firebase(addr("inventory"));

      var bottleneck =false;
      var status = "foo green";
      
    
      inventoryRef.on("value", function(snapshot) {
        $("#dataTable tr").remove(); //Clear table to prevent duplicates appending
        var table = document.getElementById("dataTable");
        snapshot.forEach(function(data) {
          var newItem = data.val();
          var row = table.insertRow(0);
          var remainingInventory = newItem.Sourcing.Quantity;
          var reorder_level = newItem.Sourcing.ReorderLevel;
          var reorder_threshold = reorder_level*0.1
          
          cell0 = row.insertCell(0);
          cell0.setAttribute('contenteditable',false);
          
          cell1 = row.insertCell(1);
          cell1.setAttribute('contenteditable',false);  
          cell2 = row.insertCell(2);
          
          cell2.setAttribute('contenteditable',false);  
          cell3 = row.insertCell(3);
          cell3.setAttribute('contenteditable',false);
          
          cell4 = row.insertCell(4);
          cell4.setAttribute('contenteditable',false);
            
          cell5 = row.insertCell(5);
          cell5.setAttribute('contenteditable',false);
            
          cell6 = row.insertCell(6);
          cell6.setAttribute('contenteditable',false);
            
          cell7 = row.insertCell(7);
          cell7.setAttribute('contenteditable',false);
            
          var hiddenKey=row.insertCell(8);
          hiddenKey.innerHTML=data.key();
          hiddenKey.style.display='none';
            

          if (remainingInventory == 0) {
            cell0.innerHTML = '<div class ="foo wine"></div>'
          }
          else if (remainingInventory > reorder_level){
            cell0.innerHTML = '<div class ="foo green"></div>'
          }
          else if (remainingInventory <= 5 || remainingInventory <= reorder_threshold){
            cell0.innerHTML = '<div class ="foo yellow"></div>'
          }
          else {
            cell0.innerHTML = '<div class ="foo orange"></div>'
          }

          cell1.innerHTML = newItem.Part;
          cell2.innerHTML = newItem.Sourcing.Quantity;
          cell3.innerHTML = newItem.Sourcing.ReorderLevel;
          cell4.innerHTML = newItem.Sourcing.Cost;
          cell5.innerHTML = newItem.Sourcing.Location;
          cell6.innerHTML =newItem.Sourcing.Link;
          cell7.innerHTML = '<button class="glyphicon glyphicon-edit btn-sm glyphic-cadetblue" id="edit_button"></button><button class="glyphicon glyphicon-trash btn-sm glyphic-red" id="remove_button"></button></div>';
          cell6.innerHTML = '<a href ='+newItem.Sourcing.Link+' style="text-decoration:none"> <button class="btn btn-secondary">Order</button></a>';
          cell7.innerHTML = '<button class="glyphicon glyphicon-edit btn-sm glyphic-cadetblue btn-info" id="edit_button"></button><button class="glyphicon glyphicon-remove btn-sm glyphic-red" id="remove_button"></button></div>';
          
          document.getElementById("remove_button").onclick = deleteRow;

          //Deletes a row if the remove icon is clicked  
          function deleteRow(){
              removed_tr = $(this).closest('tr').remove();
              var fb_key = $(removed_tr).children('td:last').text();
              inventoryRef.child(fb_key).remove();                        
          }
            
          //Edits a certain table entry when the edit icon is clicked
          $(document.getElementById("edit_button")).on('click',function() {

              //Highlight row to edit
              var currentRow = $(this).closest('tr');
              currentRow.css('background-color','#a8cb17');
              var currentTD = currentRow.children('td');
              for (var i=1; i<currentTD.length-2; ++i){
                  currentTD[i].setAttribute('contenteditable',true);
              }
    
              for (var i=1; i<currentTD.length; ++i){

                  if(i==7){
                      currentTD[i].innerHTML='<button class ="glyphicon glyphicon-ok btn-sm glyphic-green" id="edit_confirm"></button>';
                      document.getElementById("edit_confirm").onclick =confirmEdit;
                      function confirmEdit(){
                          var currRow =$(this).closest('tr');
                          currRow.css('background-color','#FFFFFF');
                          currentTD[7].innerHTML ='<button class="glyphicon glyphicon-edit btn-sm glyphic-cadetblue" id="edit_button"></button><button class="glyphicon glyphicon-trash btn-sm glyphic-red" id="remove_button"></button></div>';
                          for(var i=0; i<currentTD.length;++i){
                              currentTD[i].setAttribute('contenteditable',false);
                              var fb_key = currentRow.children('td:last').text();
                              inventoryRef.child(fb_key).update({
                                  Part:currentTD[1].innerHTML,
                                  Sourcing:{
                                      "Cost":currentTD[4].innerHTML,
                                      "Quantity":currentTD[2].innerHTML,
                                      "ReorderLevel":currentTD[3].innerHTML,
                                      "Location":currentTD[5].innerHTML,
                                      "Link":currentTD[6].innerHTML
                                  }
                              })
                          }
                      }

                  }
                  
                  
              }
              
          });          
            
        })
      })

      document.getElementById("new_inventory_entry").style.display='none';
      var buttonID = document.getElementById("add_item");
      buttonID.onclick = function(){
        document.getElementById("new_inventory_entry").style.display='block';
        var buttonPush = document.getElementById("add_item");
        buttonPush.onclick =function(){
          inventoryRef.push({
            Part:document.getElementById("part_input").value,
            Sourcing: {
              "Cost":document.getElementById("cost_input").value,
              "Quantity":document.getElementById("quantity_input").value,
              "ReorderLevel":document.getElementById("reorder_input").value,
              "Location":document.getElementById("location_input").value,
              "Link":document.getElementById("link_input").value
            }
          })
          document.getElementById("new_inventory_entry").style.display='none';
        }
      }
      break;
    case "orders":
      // -------------------------------------------------------------------------
      // orders
      // -------------------------------------------------------------------------
      // clear the table in case there's anything there
      // get firebase stuff
      var ordersRef = new Firebase(addr("orders"));

      makeTable = function(snapshot) {
        var table = document.getElementById("ordersTable-body");
        table.innerHTML = "";

        snapshot.forEach(function(data) {
          var newItem = data.val();
          var row = table.insertRow(0);
          var colIndex = 0;

          // first create the status column with defult color circle 
          var col_status = row.insertCell(colIndex++);
          col_status.innerHTML = '<div class ="foo orange"></div>'

          col_status.setAttribute("class", "firstcol")

          // insert following data 
          var col_order_num = row.insertCell(colIndex++);
          col_order_num.innerHTML = newItem.order_num;
          col_order_num.setAttribute("contenteditable", false);
          col_order_num.setAttribute("celltype", "order_num");  
          var col_name = row.insertCell(colIndex++);
          col_name.innerHTML = newItem.name;
          col_name.setAttribute("contenteditable", false);
          col_name.setAttribute("celltype", "name");
          var col_address = row.insertCell(colIndex++);
          col_address.innerHTML = newItem.address;
          col_address.setAttribute("contenteditable", false);
          col_address.setAttribute("celltype", "address");
          var col_items = row.insertCell(colIndex++);
          col_items.innerHTML = newItem.items;
          col_items.setAttribute("contenteditable", false);
          col_items.setAttribute("celltype", "item");
          var col_deadline = row.insertCell(colIndex++);
          col_deadline.innerHTML = newItem.deadline;
          col_deadline.setAttribute("contenteditable", false);
          col_deadline.setAttribute("celltype", "deadline");


          // calculate the days left 
          var sortColindex = colIndex;
          var col_dayLeft = row.insertCell(colIndex++);
          col_dayLeft.setAttribute("style", "font-weight:bold");
          var daysLeft = driver.getTimeLeft(newItem.deadline);
          col_dayLeft.innerHTML = daysLeft;

          // edit
          row.insertCell(colIndex++).innerHTML = '<button class="glyphicon glyphicon-edit btn-sm btn-info" featureSrc="orders" onclick="driver.editEntry(event)"></button></button> <button class="glyphicon glyphicon-trash btn-sm btn-danger" onclick="driver.deleteEntry(event)">'

          // hidden key
          var hidden_key = row.insertCell(colIndex++);
          hidden_key.innerHTML = data.key();
          hidden_key.style.display='none';

          // update
          driver.updateStatus(col_status,daysLeft);
        }); // FOR EACH

        tableObject = document.getElementById("ordersTable");
        sorttable.makeSortable(tableObject);
      } // makeTable
      // if anything happens, reload
      ordersRef.on("value", makeTable);
      // ordersRef.on("child_added", makeTable);
      // ordersRef.on("child_changed", makeTable);
      // ordersRef.on("child_removed", makeTable);
      break;
    case "shipping":
     
      // -------------------------------------------------------------------------
      // SHIPPING
      // -------------------------------------------------------------------------
      var shipRef = new Firebase(addr("shipping"));

      shipRef.on("value", function(snapshot) {
        var table = document.getElementById("shippingTable-body");
        snapshot.forEach(function(data) {
          var newItem = data.val();
          var row = table.insertRow(0);
          var colIndex = 0;

          // first create the status column with defult color circle 
          var col_status = row.insertCell(colIndex++);
          col_status.innerHTML = '<div class ="foo orange"></div>'

          col_status.setAttribute("class", "firstcol")

          // insert following data 
          var col_order_num = row.insertCell(colIndex++);
          col_order_num.innerHTML = newItem.order_num;
          col_order_num.setAttribute("contenteditable", false);
          col_order_num.setAttribute("celltype", "order_num");  
          var col_name = row.insertCell(colIndex++);
          col_name.innerHTML = newItem.name;
          col_name.setAttribute("contenteditable", false);
          col_name.setAttribute("celltype", "name");
          var col_address = row.insertCell(colIndex++);
          col_address.innerHTML = newItem.address;
          col_address.setAttribute("contenteditable", false);
          col_address.setAttribute("celltype", "address");
          var col_items = row.insertCell(colIndex++);
          col_items.innerHTML = newItem.items;
          col_items.setAttribute("contenteditable", false);
          col_items.setAttribute("celltype", "item");
          var col_weight = row.insertCell(colIndex++);
          col_weight.innerHTML = newItem.weight;
          col_weight.setAttribute("contenteditable", false);
          col_weight.setAttribute("celltype", "weight");
          var col_length = row.insertCell(colIndex++);
          col_length.innerHTML = newItem.flength;
          col_length.setAttribute("contenteditable", false);
          col_length.setAttribute("celltype", "length");
          var col_height = row.insertCell(colIndex++);
          col_height.innerHTML = newItem.fheight;
          col_height.setAttribute("contenteditable", false);
          col_height.setAttribute("celltype", "height");
          var col_width = row.insertCell(colIndex++);
          col_width.innerHTML = newItem.fwidth;
          col_width.setAttribute("contenteditable", false);
          col_width.setAttribute("celltype", "width");
          var col_deadline = row.insertCell(colIndex++);
          col_deadline.innerHTML = newItem.deadline;
          col_deadline.setAttribute("contenteditable", false);
          col_deadline.setAttribute("celltype", "deadline");
          

          //insert shipping button
          row.insertCell(colIndex++).innerHTML = '<button type="button" class="btn btn-info"' +
          'class="viewMore_btn" data-toggle="collapse" data-target="#demo" onclick="genLabel()"}>Shipping Label </button>';

          // insert pullout page button
          row.insertCell(colIndex++).innerHTML = '<button type="button" class="btn btn-info"' +
          'class="viewMore_btn" data-toggle="collapse" data-target="#demo" onclick="genSlip()"}>Insert Slip </button>';

          // edit
          row.insertCell(colIndex++).innerHTML = '<button class="glyphicon glyphicon-edit btn-sm" featureSrc="shipping" onclick="driver.editEntry(event)"></button></button><button class="glyphicon glyphicon-remove btn-sm" onclick="driver.deleteEntry(event)">'

          // hidden key
          var hidden_key = row.insertCell(colIndex++);
          hidden_key.innerHTML = data.key();
          hidden_key.style.display='none';

          // calculate the days left 
          var daysLeft = driver.getTimeLeft(newItem.deadline);
          driver.updateStatus(col_status,daysLeft);
        }); // FOR EACH
      });

      break;
    case "tasks":
      var tasksRef = new Firebase(addr("tasks"));
      tasksRef.on("value", function(snapshot){
        var table = document.getElementById("taskTable");
        snapshot.forEach(function(data){
          var newItem = data.val();
          var row = table.insertRow(0);
          cell0 = row.insertCell(0);
          cell0.setAttribute('contenteditable',false);
          cell1 = row.insertCell(1);
          cell1.setAttribute('contenteditable',false);
          cell2 = row.insertCell(2);
          cell2.setAttribute('contenteditable',false);
          cell3 = row.insertCell(3);
          cell3.setAttribute('contenteditable',false);
          cell4 = row.insertCell(4);
          cell4.setAttribute('contenteditable',false);
          cell5 = row.insertCell(5);
          cell4.setAttribute('contenteditable',false);
          cell6 = row.insertCell(6);
          
          cell0.innerHTML = '<div class ="foo orange"></div>'
          cell1.innerHTML = newItem.Order
          cell2.innerHTML = newItem.Item;
          cell3.innerHTML = newItem.location;
          cell4.innerHTML = newItem.next_task;
          cell5.innerHTML = newItem.team_member;
          cell6.innerHTML = ' <button class="btn btn-secondary">Next</button>'
        })
        
        document.getElementById("new_task_entry").style.display='none';
        var buttonID = document.getElementById("add_item");
        buttonID.onclick = function(){
          document.getElementById("new_task_entry").style.display='block';
        }
        
        var addTask = document.getElementById("add_to_firebase");
        addTask.onclick = function(){
          tasksRef.push({
            Order:document.getElementById("order_input").value,
            Item:document.getElementById("item_input").value,
            location:document.getElementById("location_input").value,
            next_task:document.getElementById("nextTask_input").value,
            team_member:document.getElementById("member_input").value    
          })
        }      
      })
      break;
    default:
      console.log("got bad load id");
  }
}

// run bottleneck logic here, called from loadFirebase() in the dash case of that switch
function inventory_bottleneckLogic(){
  // bottleneck code here!
  // load all relevant firebase refs, iterate through to detect "bottlenecks"
  // if bottleneck is detected, show user in the appropriate widget
  // console.log("go here");

  // INVENTORY BOTTLENECK CODE ---------------------------------------------------
  var itemsRef = new Firebase(addr("inventory"));
  itemsRef.once("value", function(snapshot){
    // table html
    s = '<div class= "table-responsive" style = "textAlign:left">' +
    '<table class="table">' + 
    '<thead>' +  
    '<tr> ' +
    '<th> Part/Material</th>' + 
    '<th> Quantity</th> ' +
    '</tr> ' +
    '</thead>' + 
    '<tbody>' ;

    snapshot.forEach(function(data) {
      k = data.val();
      // table to show inventory alert data 
      if (k.Sourcing && k.Sourcing.Quantity && k.Sourcing.Quantity < 20){
        s += makeInventoryAlert(k);
      }
    });

    s += '</tbody> </table> </div>';
    document.getElementById("total_inventory_number").innerHTML = snapshot.numChildren();
    document.getElementById("inventory-panel-body").innerHTML = s;
  });


  // bottleneck functions ----------------------
  // function for generating inventory bottleneck notification html
  function makeInventoryAlert(k){
    a = "";
    a += "<tr> <td> <b>" + String(k.Part) + " </b> </td>" 
    a +=  "<td> <b> <span style='color : red'>" + String(k.Sourcing.Quantity) + "</span> </b> </td> <tr>";
    return a;
  }
}


function orders_bottleneckLogic(){

 // ORDERS BOTTLENECK CODE ---------------------------------------------------
  var itemsRef = new Firebase(addr("orders"));
  itemsRef.once("value", function(snapshot){
    // table html
    s = '<div class= "table-responsive">' +
    '<table class="table">' + 
    '<thead>' +  
    '<tr> ' +
    '<th> Items</th>' + 
    '<th> Deadline</th> ' +
    '<th> View More </th>' +
    '</tr> ' +
    '</thead>' + 
    '<tbody>' ;

    var total_orders_number = snapshot.numChildren(); 
    var emergent_orders_number = 0;

    snapshot.forEach(function(data) {
      

      k = data.val();
      // table to show order alert data 
      if (driver.getTimeLeft(k.deadline) == 0){
        // emergent order
        emergent_orders_number++;

        s += makeOrderWidget(k);
      }
    });

    s += '</tbody> </table> </div>';
    document.getElementById("active_order_number").innerHTML = total_orders_number - emergent_orders_number;
    document.getElementById("orders-panel-body").innerHTML = s;
  });


  // bottleneck functions ----------------------
  // function for generating inventory bottleneck notification html

  var count = 0;
  function makeOrderWidget(k){
    
    a = "";
    a += "<tr>";
    a += "<td> <b>" + String(k.items) + " </b> </td>" ;
    a += "<td> <b> <span style='color : red'>" + String(k.deadline) + "</span> </b> </td>";
    a += "<td> <button class ='btn btn-info' onclick = driver.orders_viewMore(event)> View </button> </td> </tr>";
    a += "<tr class='danger' style='display:none; backgroundColor: '> <td colspan = '3'> ";
    a += "Order# : <b>"  + String(k.order_num) + "</b> <br> Name : <b>" + String(k.name) + " </b><br> Address : <b>" + String(k.address) + "</b> </td>";
    a += "</tr> ";

    count ++;
    // a +=  "<tr>";
    return a;
  }
} // orders_bottleneckLogic

// global object of driver
driver = {
  orders_viewMore: function(e){
    // $("#viewMore").click(function(e){
   // orderstable's viewMore button to show details 
    e.preventDefault();

    var hiddenRow = e.target.parentNode.parentNode.nextSibling;

    if (hiddenRow.style.display === 'none') {
      hiddenRow.setAttribute("style", "display:blcok");
    } else {
      hiddenRow.setAttribute("style", "display:none");
    }
  },
  updateStatus: function(col_status, daysLeft) {
    if (daysLeft == 0 ) {
      col_status.innerHTML = '<div id = "redFilledCircle"></div>';

    // to do check whether complete or not ------------------------
    }
    else if (daysLeft <= 7){
      col_status.innerHTML = '<div id = "yellowFilledCircle"></div>';
    }
    else if (daysLeft > 7){
      col_status.innerHTML = '<div id = "greenFilledCircle"></div>';
    }
    else {
      col_status.innerHTML = '<div id ="orangeFilledCircle"></div>';
    }
  },
  getTimeLeft: function(deadline){
    var dateObj = new Date(deadline);  // convert string to date object 

    var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
    var firstDate = dateObj;
    var secondDate = new Date();

    var diffDays = Math.round((firstDate.getTime() - secondDate.getTime())/(oneDay));
    if (diffDays <= 0)
      diffDays = 0;
    return diffDays;
  },  // getTimeLeft
  tempEntry: "",
  editEntry: function(e){
    featureSource = document.getElementById("featureSrc").getAttribute("featureSrc");
    switch (featureSource){
      case "orders":
        switch (e.target.getAttribute("class")){
          case "glyphicon glyphicon-edit btn-sm btn-info":
            // uneditable -> editable

            // console.log("testing");
            // make editable
            this.tempEntry = e.target.parentElement.parentElement.cloneNode(true);
            tdArr = e.target.parentElement.parentElement.children;
            for (var i=0; i<tdArr.length; i++){
              if (tdArr[i].getAttribute("contenteditable") != null){
                tdArr[i].setAttribute("contenteditable", true);
              }
              switch (tdArr[i].getAttribute("celltype")){ 
                case "order_num":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = '<strong>##</strong>';
                    tdArr[i].setAttribute("onfocus", '"driver.selectAll(event)"');
                  }
                  break
                case "name":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>first last</strong>";
                  }
                  break
                case "address":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>address</strong>";
                  }
                  break
                case "item":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>item name</strong>";
                  }
                  break
                case "deadline":
                  // make input dom
                  var s = '<input contenteditable="true" celltype="deadline" type="date" style="height:100% !important; width:100% !important">'+tdArr[i].html+'</input>'; // HTML string
                  var div = document.createElement('div');
                  div.innerHTML = s;
                  var newDom = div.childNodes[0];
                  newDom.style.backgroundColor = "#D5F5E3";

                  // replace old dom
                  domToReplace = tdArr[i];
                  domToReplace.parentElement.insertBefore(newDom, domToReplace);
                  domToReplace.parentElement.removeChild(domToReplace);
                  tdArr[i].innerHTML = "<strong>mm/dd/yyyy</strong>";
                  break
                case "weight":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>weight</strong>";
                  }
                  break 
                case "length":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>length</strong>";
                  }
                  break 
                case "height":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>height</strong>";
                  }
                  break 
                case "width":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>width</strong>";
                  }
                  break 
              }
            }
              
            // change button
            e.target.setAttribute("class", "glyphicon glyphicon-ok btn-sm btn-success");
            // change cancel button too
            e.target.parentElement.lastChild.setAttribute("class", "glyphicon glyphicon-remove btn-sm btn-danger");
            e.target.parentElement.lastChild.setAttribute("onclick", "driver.unselectEntry(event)");


            // change style
            e.target.parentElement.parentElement.style.backgroundColor = "#D5F5E3";

            break;
          case "glyphicon glyphicon-ok btn-sm btn-success":
            // editable -> uneditable
            // send to firebase
            // reload

            // console.log("testing");
            // make uneditable
            tdArr = e.target.parentElement.parentElement.children;
            for (var i=0; i<tdArr.length; i++){
              if (tdArr[i].getAttribute("contenteditable") != null){
                tdArr[i].setAttribute("contenteditable", false);
              }
            }
            // change button
            e.target.setAttribute("class", "glyphicon glyphicon-edit btn-sm");
            e.target.parentElement.lastChild.setAttribute("class", "glyphicon glyphicon-remove btn-sm");
            e.target.parentElement.lastChild.setAttribute("onclick", "driver.deleteEntry(event)");

            // send to firebase 
            entry_key = e.target.parentNode.parentNode.lastChild.innerText;
            entry_rowIndex = e.target.parentNode.parentNode.rowIndex - 1;  // Index starts 0

            // get all data with false contenteditable
            dataToSend = {};
            // row data is an object
            $("#ordersTable-body").find('tr:eq(' + entry_rowIndex +')').each(function() {
              $(this).find('td').each(function() {
                if (this.cellIndex == 5) {
                  // this is pointing to daysleft column
                  // deadline column update daysLeftColumn
                  this.innerText = driver.getTimeLeft(this.previousSibling.value);
                  driver.updateStatus(this.parentNode.firstChild, this.innerText);
                }

                if (this.hasAttribute("contenteditable")) {
                  colName = $('#ordersTable').find('th').eq(this.cellIndex).text().trim();
                  switch (colName){
                    case "Order#":
                      headerText="order_num";
                      data = this.innerText;
                      break;
                    case "Name": 
                      headerText="name";   
                      data = this.innerText; 
                      break;
                    case "Address": 
                      headerText="address"; 
                      data = this.innerText; 
                      break;
                    case "Items": 
                      headerText="items";  
                      data = this.innerText; 
                      break;
                    // default:
                  }

                  dataToSend[headerText] = data;
                }

              deadlineCol = $('#ordersTable').find('input').val();
                if (deadlineCol){
                  headerText = "deadline";
                  data = deadlineCol;

                  dataToSend[headerText] = data;
                }
              });// each td find contenteditable
            }); // find row of the event happens

            // replace entry with original data
            // if no modifications, then this will be what's seen because table refresh is not triggered
            // if modifications, this will be overwritten with proper data on table refresh callback
            domToReplace = e.target.parentElement.parentElement;
            domToReplace.parentElement.insertBefore(this.tempEntry, domToReplace);
            domToReplace.parentElement.removeChild(domToReplace);

            // send to database
            var ordersRef = new Firebase(addr("orders") + entry_key);
            ordersRef.update(dataToSend);

            // change style
            e.target.parentElement.parentElement.style.backgroundColor = "";
            // change arianas stupid input thing 
            tdArr = e.target.parentElement.parentElement.children;
            for (i in tdArr){
              if (tdArr[i].getAttribute){
                if (tdArr[i].getAttribute("celltype")=="deadline"){
                  tdArr[i].style.backgroundColor = "";
                }            
              }
            }
        }
        break;
      case "shipping":
        switch (e.target.getAttribute("class")){
          case "glyphicon glyphicon-edit btn-sm btn-info":
            // uneditable -> editable

            // console.log("testing");
            // make editable
            this.tempEntry = e.target.parentElement.parentElement.cloneNode(true);
            tdArr = e.target.parentElement.parentElement.children;
            for (var i=0; i<tdArr.length; i++){
              if (tdArr[i].getAttribute("contenteditable") != null){
                tdArr[i].setAttribute("contenteditable", true);
              }
              switch (tdArr[i].getAttribute("celltype")){ 
                case "order_num":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = '<strong>##</strong>';
                    tdArr[i].setAttribute("onfocus", '"driver.selectAll(event)"');
                  }
                  break
                case "name":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>first last</strong>";
                  }
                  break
                case "address":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>address</strong>";
                  }
                  break
                case "item":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>item name</strong>";
                  }
                  break
                case "deadline":
                  // make input dom
                  var s = '<input contenteditable="true" celltype="deadline" type="date" style="height:100% !important; width:100% !important">'+tdArr[i].html+'</input>'; // HTML string
                  var div = document.createElement('div');
                  div.innerHTML = s;
                  var newDom = div.childNodes[0];
                  newDom.style.backgroundColor = "#D5F5E3";

                  // replace old dom
                  domToReplace = tdArr[i];
                  domToReplace.parentElement.insertBefore(newDom, domToReplace);
                  domToReplace.parentElement.removeChild(domToReplace);
                  tdArr[i].innerHTML = "<strong>mm/dd/yyyy</strong>";
                  break
                case "weight":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>weight</strong>";
                  }
                  break 
                case "length":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>length</strong>";
                  }
                  break 
                case "height":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>height</strong>";
                  }
                  break 
                case "width":
                  if (tdArr[i]==""){
                    tdArr[i].innerHTML = "<strong>width</strong>";
                  }
                  break 
              }
            }
              
            // change button
            e.target.setAttribute("class", "glyphicon glyphicon-ok btn-sm btn-success");
            // change cancel button too
            e.target.parentElement.lastChild.setAttribute("class", "glyphicon glyphicon-remove btn-sm btn-danger");
            e.target.parentElement.lastChild.setAttribute("onclick", "driver.unselectEntry(event)");


            // change style
            e.target.parentElement.parentElement.style.backgroundColor = "#D5F5E3";

            break;
          case "glyphicon glyphicon-ok btn-sm btn-success":
            // editable -> uneditable
            // send to firebase
            // reload

            // console.log("testing");
            // make uneditable
            tdArr = e.target.parentElement.parentElement.children;
            for (var i=0; i<tdArr.length; i++){
              if (tdArr[i].getAttribute("contenteditable") != null){
                tdArr[i].setAttribute("contenteditable", false);
              }
            }
            // change button
            e.target.setAttribute("class", "glyphicon glyphicon-edit btn-sm");
            e.target.parentElement.lastChild.setAttribute("class", "glyphicon glyphicon-remove btn-sm");

            // send to firebase 
            entry_key = e.target.parentNode.parentNode.lastChild.innerText;
            entry_rowIndex = e.target.parentNode.parentNode.rowIndex - 1;  // Index starts 0

            // get all data with false contenteditable
            dataToSend = {};
            // row data is an object
            $("#ordersTable-body").find('tr:eq(' + entry_rowIndex +')').each(function() {
              $(this).find('td').each(function() {
                if (this.cellIndex == 5) {
                  // this is pointing to daysleft column
                  // deadline column update daysLeftColumn
                  this.innerText = driver.getTimeLeft(this.previousSibling.value);
                  driver.updateStatus(this.parentNode.firstChild, this.innerText);
                }

                if (this.hasAttribute("contenteditable")) {
                  colName = $('#ordersTable').find('th').eq(this.cellIndex).text().trim();
                  switch (colName){
                    case "Order#":
                      headerText="order_num";
                      data = this.innerText;
                      break;
                    case "Name": 
                      headerText="name";   
                      data = this.innerText; 
                      break;
                    case "Address": 
                      headerText="address"; 
                      data = this.innerText; 
                      break;
                    case "Items": 
                      headerText="items";  
                      data = this.innerText; 
                      break;
                    // default:
                  }

                  dataToSend[headerText] = data;
                }
              deadlineCol = $('#ordersTable').find('input').val();
                if (deadlineCol){
                  headerText = "deadline";
                  data = deadlineCol;
                  dataToSend[headerText] = data;
                }
              });// each td find contenteditable
            }); // find row of the event happens

            // console.log(dataToSend);

            var ordersRef = new Firebase(addr("shipping") + entry_key);
            ordersRef.update(dataToSend);

            // change style
            e.target.parentElement.parentElement.style.backgroundColor = "";
            // change arianas stupid input thing 
            tdArr = e.target.parentElement.parentElement.children;
            for (i in tdArr){
              if (tdArr[i].getAttribute){
                if (tdArr[i].getAttribute("celltype")=="deadline"){
                  tdArr[i].style.backgroundColor = "";
                }            
              }
            }
            break;
        }
        break;
    }
  },
  unselectEntry: function(e){
    // alert("unselecting entry");
    domToReplace = e.target.parentElement.parentElement;
    domToReplace.parentElement.insertBefore(this.tempEntry, domToReplace);
    domToReplace.parentElement.removeChild(domToReplace);
  },
  addEmptyItem: function(e){
    featureSource = document.getElementById("featureSrc").getAttribute("featureSrc");
    switch(featureSource){
      case "orders":
        addEmptyItemRef = new Firebase(addr(featureSource));
        objToPush = {
          "order_num":  "",
          "name":       "",
          "address":    "",
          "items":      "",
          "deadline":   "",
          "weight":     "",
          "height":     "",
          "width":      "",
          "length":      "",          
        }
        break;
      case "shipping":
        // same as orders, uses same database
        addEmptyItemRef = new Firebase(addr(featureSource));
        objToPush = {
          "order_num":  "",
          "name":       "",
          "address":    "",
          "items":      "",
          "deadline":   "",
          "weight":     "",
          "height":     "",
          "width":      "",
          "length":      "",          
        }
        break;
    }
    addEmptyItemRef.push(objToPush);
  },
  reload: function(id){

    loadFirebase(id);
  },
  deleteEntry: function(e){
    entry_key = e.target.parentNode.parentNode.lastChild.innerText;
    var remRef = new Firebase(addr("orders") + entry_key);
    remRef.remove();
  },
  makeLabel: function(e){
    // if 
    var path    = require("path");
    console.log(__dirname);

    app.get('/',function(req,res){
      res.sendFile(path.join(__dirname+'/shipping.html'));
      console.log(__dirname);
      //__dirname : It will resolve to your project folder.
    });


    app.listen(3000);

    console.log("Running at Port 3000");

    var apiKey = '5NTaCzvLSV1MnYPbNpwxOg';
    var easypost = require('node-easypost')(apiKey);

    // set addresses
    var toAddress = {
      name: document.getElementById("name_input").value,
      street1: document.getElementById("address_input").value,
      city: "Redondo Beach",
      state: "CA",
      zip: "90277",
      country: "US",
      phone: "310-808-5243"
    };
    var fromAddress = {
      name: "Square1",
      street1: "The Garage",
      street2: "4th Floor",
      city: "Evanston",
      state: "Il",
      zip: "60201",
      phone: "415-123-4567"
    };

    // verify address
    easypost.Address.create(fromAddress, function(err, fromAddress) {
      fromAddress.verify(function(err, response) {
        if (err) {
          console.log('Address is invalid.');
        } else if (response.message !== undefined && response.message !== null) {
          console.log('Address is valid but has an issue: ', response.message);
          var verifiedAddress = response.address;
        } else {
          var verifiedAddress = response;
        }
      });
    });

    // set parcel
    easypost.Parcel.create({
      predefined_package: "InvalidPackageName",
      weight: 21.2
    }, function(err, response) {
      console.log(err);
    });

    var parcel = {
      length: 10.2,
      width: 7.8,
      height: 4.3,
      weight: 21.2
    };

    var postage_label;

    // create shipment
    easypost.Shipment.create({
      to_address: toAddress,
      from_address: fromAddress,
      parcel: parcel,
      customs_info: customsInfo
    }, function(err, shipment) {
      // buy postage label with one of the rate objects
      shipment.buy({rate: shipment.lowestRate(['USPS', 'ups', 'Fedex']), insurance: 100.00}, function(err, shipment) {
        console.log(shipment.tracking_code);
        console.log(shipment.postage_label.label_url);
        postage_label = shipment.postage_label.label_url;
      });
    });
  },
  logout: function(e){

    globalref.unauth();
  },
}
