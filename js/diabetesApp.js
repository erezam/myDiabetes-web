var UserAPI = function() {

//	Create the initial appearance of the site
	var initModule = function() {
		storageAPI.init();	// init local storage
		fillForm();
		$("#but").click(setUser);
    };
	
////////////////////////////////////////////////////////////////////////////////////////////////   
//	Create new user or change user settings 
	var setUser = function() {
        var name = $("#txtName").val();
        var age = $("#txtAge").val();
		var gender = $("#txtGender").val();
        var corFactor = $("#txtcorFactor").val();
		var carbFactor = $("#txtcarbFactor").val();
        var glucTarget = $("#txtgluc").val();
		var email = $("#txtEmail").val();
		if(name == "" || corFactor == "" || carbFactor == "" ||glucTarget == ""
			||parseInt(glucTarget)<0 ||parseInt(corFactor)<0||parseInt(carbFactor)<0 ||parseInt(age)<0 || email == "")
			return;		// wrong / missing input
		storageAPI.createObject("User");	// create user on local storage
		storageAPI.createObject("Measurement");	//  create Measurement(empty) on local storage
        var item = {id : name, email: email, age: age,gender:gender , corFactor:corFactor , carbFactor:carbFactor, glucTarget:glucTarget};
        storageAPI.save("User", item);	
		fillForm();
		blurFunc();
		window.scrollTo(0,0);		
    };
////////////////////////////////////////////////////////////////////////////////////////////////
// Calculation will calc the needed bolus, prints it and save it on storage.
	var calculation = function() {
		var date = $("#txtDate").val();
		var time = $("#txtTime").val();
		var gluc = $("#txtGlucLevel").val();
		var carbs="";
		if(document.getElementById('carbsIndex').checked)
		{
			carbs = $("#txtCarbsIndex").val();
			if(parseInt(carbs)<0 || carbs=="")
				return;		// wrong input
		}
		if(parseInt(gluc)<0 ||  date==undefined || time==undefined || gluc=="")
			return;		// wrong input
		var res;
		var measurement= storageAPI.getAll("Measurement");
		if(measurement.length != 0)		// Measurement must be enterd in the right order
		{
			if((measurement[measurement.length-1]).date > date)
			{
				sweetAlert("Oops...", "Can't add measurement in wrong order!", "error");
				return;
			}
			if(measurement[measurement.length-1].date == date)
				if(measurement[measurement.length-1].time > time)
				{
					sweetAlert("Oops...", "Can't add measurement in wrong order!", "error");
					return;
				}
		}
		if(measurement.length == 0)
			var index= 0;
		else
			var index=measurement[measurement.length-1].id+1;
		
		// BOLUS CALC //
		var arr=  storageAPI.getAll("User");
		var glucCorrection= (parseInt(gluc)-parseInt(arr[0].glucTarget))/parseInt(arr[0].corFactor);
		if($("#notEating").is(':checked'))
			res= glucCorrection;
		else
		{
			var food= parseInt(carbs)/parseInt(arr[0].carbFactor);		
			var res= glucCorrection+food;
		}
		fillForm();
		res=parseInt(res);
		if(res<0)
			res=0;		// no negative bolus
		
		// Print Recommended bolus //
		if(parseInt(gluc)<60)
			swal("Measurement saved", "LOW SUGAR! Recommended Bolus : "+res, "success");
		else if(parseInt(gluc)>250)
			swal("Measurement saved", "HIGH SUGAR! </br> Recommended Bolus : "+res, "success");
		else
			swal("Measurement saved", "Recommended Bolus : "+res, "success");
		
		//Save Measurement on storage //
		var item= {id : index  , date:date, time :time, gluc : gluc,carbs : carbs, result: res};
		index++;
		storageAPI.save("Measurement", item);
		return false;
	};
	
////////////////////////////////////////////////////////////////////////////////////////////////
//	Create and prints Measurements Table
	var showTable = function() {
		var flag= true;
        var items = storageAPI.getAll("Measurement");
        if(items.length == 0)
            return;
        $("tr:gt(0)").remove();
        var tableHead =		
		"<tr>"+
                "<th>Date</th>"+
                "<th>Time</th>"+
                "<th>Glucose level</th>"+
				"<th>Food Carbs	</th>"+
				"<th>Bolus</th>"+
				"<th></th>"+
        "</tr>";		// Table head line
		$("table").html(tableHead);
		if(($("#txtFrom").val() == "") || ($("#txtTo").val() == ""))
			flag= false;		// if flag false show full table else show by dates			
        $.each(items, function(i, item) {
				if(!flag)
				{
					if(parseInt(item.gluc)<60 || parseInt(item.gluc)>250)
					{
						var row = "<tr class='trRed'><td>" + item.date + "</td><td>" + item.time + "</td><td>" + item.gluc + "</td><td>" 
							+ item.carbs + "</td><td>" + item.result + "</td><td>" + "<img src='css/Delete.png' id='"+item.id+"' class='DeleteImg' title='delete'/>" + "</td></tr>";
					}
					else
						var row = "<tr><td>" + item.date + "</td><td>" + item.time + "</td><td>" + item.gluc + "</td><td>" 
						+ item.carbs + "</td><td>" + item.result + "</td><td>"  + "<img src='css/Delete.png' id='"+ item.id +"' class='DeleteImg' title='delete'/>" + "</td></tr>";
					$("tr:last").after(row);	// add to html
					var cmd = document.getElementById(""+item.id);	// delete Measurement cmd
					cmd.addEventListener("click" , clickListener , false);
				}
				else
				{
					if(item.date>=$("#txtFrom").val() && item.date<=$("#txtTo").val())	// show Measurement by dates
					{
						if(parseInt(item.gluc)<60 || parseInt(item.gluc)>250)
						{
							var row = "<tr class='trRed'><td>" + item.date + "</td><td>" + item.time + "</td><td>" + item.gluc + "</td><td>" 
								+ item.carbs + "</td><td>" + item.result + "</td><td>" + "<img src='css/Delete.png' id='"+item.id+"' class='DeleteImg' title='delete'/>" + "</td></tr>";
						}
						else
							var row = "<tr><td>" + item.date + "</td><td>" + item.time + "</td><td>" + item.gluc + "</td><td>" 
								+ item.carbs + "</td><td>" + item.result + "</td><td>"  + "<img src='css/Delete.png' id='"+ item.id +"' class='DeleteImg' title='delete'/>" + "</td></tr>";
						$("tr:last").after(row);
						var cmd = document.getElementById(""+item.id);	// delete Measurement cmd
						cmd.addEventListener("click" , clickListener , false);
					}
				}
        });
		// Show the table
		$(".modal").css({"display":"block"});
		$("table").css({"display":"block"});
		$("#close").unbind('click').click(close);
		return false;
    };
	
////////////////////////////////////////////////////////////////////////////////////////////////	
//	clickListener for delete Measurement cmd , delete specific Measurement
	var clickListener = function(e) {
		swal({
		  title: "Are you sure?",
		  text: "You will not be able to recover this measurement!",
		  type: "warning",
		  showCancelButton: true,
		  confirmButtonColor: "#DD6B55",
		  confirmButtonText: "Yes, delete it!",
		  closeOnConfirm: false
		},
		function(){
			swal("Deleted!", "Your measurement has been deleted.", "success");
			var arr= storageAPI.getAll("Measurement");
			var measurements = JSON.parse(window.localStorage.Measurement || {});
			for(var i=0; i < arr.length; i++)
			{
				if(arr[i].id == e.target.id)
				{
					delete measurements[e.target.id];
					break;
				}
			}
			window.localStorage.Measurement = JSON.stringify(measurements);
			$("table").html("");
			$("#showTable").html("");
			initModule();
			showTable();
			return false;
		});
	}
////////////////////////////////////////////////////////////////////////////////////////////////
// Show Measurements on chart 	
	var chart = function() {
		var flag= true;
		if(($("#txtFrom").val() == "") || ($("#txtTo").val() == ""))
			flag= false;
		var items = storageAPI.getAll("Measurement");
        if(items.length == 0)
            return;
		$(".modal").css({"display":"block"});
		$("#container").css({"display":"block"});
		$("#close").unbind('click').click(close);
		var glucArray= [], bolusArray= [], carbsArray= [];
		var j=0;	// index in chart arrays
		for(var i=0; i<items.length; i++ )
		{
			if(flag)	// show Measurements by dates
			{
				if(items[i].date<$("#txtFrom").val() || items[i].date>$("#txtTo").val())
					continue;
			}
			glucArray[j]= parseInt(items[i].gluc);
			bolusArray[j]= parseInt(items[i].result);
			carbsArray[j]= parseInt(items[i].carbs);
			j++; 
		}
		Highcharts.chart('container', {
			title: {
				text: 'Measurements'
			},
			yAxis: {
				title: {
					text: ''
				}
			},
			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'middle'
			},
			plotOptions: {
				series: {
					pointStart: 1
				}
			},
			series: [{
				name: 'Glucose Level',
				data: glucArray
			}, {
				name: 'Carbs',
				data: carbsArray
			}, {
				name: 'Bolus',
				data: bolusArray
			}]
		});
		return false;
	};
////////////////////////////////////////////////////////////////////////////////////////////////
//  Close Table/Chart window
	var close = function(){
		$(".modal").css({"display":"none"});
		$("#container").css({"display":"none"});
		$("table").css({"display":"none"});
	}
////////////////////////////////////////////////////////////////////////////////////////////////
// Change user settings	without delete Measurements
	var edit = function() {
		swal({
			  title: "Are you sure?",
			  text: "You want to change your settings?",
			  type: "warning",
			  showCancelButton: true,
			  confirmButtonColor: "#DD6B55",
			  confirmButtonText: "Yes, change it!",
			  closeOnConfirm: false
		},
		function(){
			swal("Ok!", "Moving you to the home page", "success");
			storageAPI.drop("User");	// delete exicst user settings
			$("table").html("");
			$("#showTable").html("");
			initModule();
		});
	};
////////////////////////////////////////////////////////////////////////////////////////////////
// Send Measurements to yoer email	
	var email= function(){
		var mes=  storageAPI.getAll("Measurement");
		if(mes.length == 0)
		{
			sweetAlert("Oops...", "Your measurements empty , can't send!", "error");
			return;
		}
		var user=  storageAPI.getAll("User");
		swal({
		  title: "Are you sure?",
		  text: "You sure you want to send your measurements to this email: "+user[0].email,
		  type: "warning",
		  showCancelButton: true,
		  confirmButtonColor: "#66ff66",
		  confirmButtonText: "Yes, send it!",
		  closeOnConfirm: false
		},
		function(){
			swal("Sent!", "Your Measurements has been sent to your email.", "success");
			showTable();
			var value = $('table').html();
			close();
			window.scrollTo(0, 0);
			emailjs.send("diabetesappjce","template_f2FECUgW",{to_email: user[0].email, to_name: user[0].id, message_html: value});
		});
	}
////////////////////////////////////////////////////////////////////////////////////////////////
// Delete all Measurements	
	var resetSettings = function() {
		swal({
		  title: "Are you sure?",
		  text: "Reset will erase all existing Measurement. Are you sure you want to reset?",
		  type: "warning",
		  showCancelButton: true,
		  confirmButtonColor: "#DD6B55",
		  confirmButtonText: "Yes, delete it!",
		  closeOnConfirm: false
		},
		function(){
		  swal("Deleted!", "Your Measurements has been deleted.", "success");
		  storageAPI.drop("Measurement");
			storageAPI.createObject("Measurement");
			$("table").html("");
			$("#showTable").html("");
			initModule();
			return false;
		});
		
	}
////////////////////////////////////////////////////////////////////////////////////////////////
// Create the views on html
	var fillForm = function() {
	var user= storageAPI.getAll("User");
	// REGISTRATION //
	var registerStr=
				"<fieldset>" +
				"<legend><span class='number'>1</span> Personal Information</legend>" +
				"<label for = 'txtWelcome'>Hello Guest</label>" +
				"</p>" +
                "<input id = 'txtName' type= 'text' placeholder='Your Name *' required autofocus>" +
				"<br/>" +
                "<input type='number' id = 'txtAge' placeholder='Age' min = '0' max = '120'>" +
				"<br/>" +
				"<select id = 'Gender'>" +
					"<option id = 'chooseGender'> Gender</option>" +
					"<option id = 'Male'> Male</option>" +
					"<option id = 'Female'> Female</option>" +
                "</select>" +
				"<input id = 'txtEmail' type= 'email' placeholder='Email *' required>" +
				"</p>" +
				"</fieldset>" +
				"<fieldset>" +
				"<legend><span class='number'>2</span> Smart Bolus Settings </legend>" +
                "<input type='number' id = 'txtcorFactor'  placeholder='Insulin sensitivity *' min = '0' required>"+
				"<br/>" +
                "<input type='number' id = 'txtcarbFactor' placeholder='Carbohydrate ratio *' min = '0' required>" +
				"<br/>" +
                "<input type='number' id = 'txtgluc' placeholder='Blood glucose target *' min = '0' required>" +
				"<br/>" +
				"<input id= 'but' type='submit' value = 'Register' />" +
			"</fieldset>" 
	
	var instructions =
				"<h2> Instructions: </h2>"+
				"</p>"+
				"The Smart bolus calculator, Used to recommend the amount of insulin nedded to inject According to the following parameters:"+
				"</p>"+
				"<h4>Insulin sensitivity:</h4>"+
				"Insulin sensitivity indicates the drop in blood glucose "+
				"level (mmol/l) caused by each unit of insulin taken. </br>"+
				"Usually about 50."+
				"</p>"+
				"<h4>Carbohydrate ratio</h4>"+
				"The carbohydrate ratio indicates how many grams of"+
				"carbohydrates are covered by one unit of insulin, i.e."+
				"how many grams of carbohydrates you can eat per unit "+
				"of insulin. </br>"+
				"Usually about 10."+
				"</p>"+
				"<h4>Blood glucose target:</h4>"+
				"The blood glucose target is the blood glucose you"+
				"aim for before a meal and two hours after a meal.</br>"+
				"Usually about 100."+
				"</p>"+
				"*The parameters should be calculated by a diabetes doctor." ;
	
	
	// BOLUS CALC //
	var calculator=
		"<fieldset>" +
					"<legend>Smart Bolus</legend>"+
				"<div id='hello'>"+
				"</div>" +
				"</p>" +
                "<label for = 'txtDate'>Date:</label>" +
                "<input id = 'txtDate' type= 'date' required>" +
				"<br/>" +
				"<label for = 'txtTime'>Time:</label>" +
                "<input type='time' id = 'txtTime' required>" +
				"<br/>" +
				"<label for = 'txtGlucLevel'>Glucose Level:</label>" +
				 "<input type= 'number' id = 'txtGlucLevel' min = '0' required>" +
				 "<br/>" +
				 "<form id='radioCarbs'>" +
					"<input type='radio' name='food' id='notEating' value='notEating' checked> Not Eating (Correction Bolus)</p>" +
					"<input type='radio' name='food' id='carbsIndex' value='carbsIndex'> Food - Carbs Index(gr):"+
					"<input type='number' id = 'txtCarbsIndex' min = '0'><br>" +
				 "</form>" +
				"</p>" +
				"<input id= 'butCalc' type='submit' value = 'Calc' />" +
		"</fieldset>";
								
		var showTableStr=
		"<fieldset>" +
				"<legend>Table Settings</legend>"+
				"(To show all measurements leave the date fields empty)</p></br>"+
                "<label for = 'txtFrom'>From date:</label>" +
                "<input id = 'txtFrom' type= 'date'>" +
				"<br/>" +
				"<label for = 'txtTo'>To date:</label>" +
                "<input id = 'txtTo' type= 'date'>" +
				"<p/>" +
				"<input id= 'butShowAll' type='submit' value = 'Show data in table' />" +
				"<input id= 'butShowRange' type='submit' value = 'Show data in chart' />" +
				"</p>" +
		"</fieldset>";				
		
		var buttons=
			"<div class='tooltip'><img src='css/help.png' id= 'buthelp' class='helpBut'/>" +
					"<span class='tooltiptext'>Restart: Will erase all the measurements</p>User Settings: Will allow you to edit the user settings, not erase the measurements</p>Email: will send the measurements table to your email</span>" +
				"</div>" +
				"<img src='css/email.png' id= 'butEmail' class='emailImg' title= 'Email'/>" +
				"<img src='css/restart.png' id= 'butReset' class='restartImg' title= 'Restart'/>" +
				"<img src='css/settings.png' id= 'butEdit' class='settingImg' title= 'User Settings'/>";
				
			if(localStorage.getItem("User"))
			{
				$("#Form").html(calculator);
				$("#showTable").html(showTableStr);
				$(".buttons").html(buttons);
				$("#butCalc").click(calculation);
				$("#butShowAll").click(showTable);
				$("#butShowRange").click(chart);
				$("#butEmail").unbind('click').click(email);
				$("#butEdit").unbind('click').click(edit);
				$("#butReset").unbind('click').click(resetSettings);
				$("#hello").html("Hello " + user[0].id);
			}
			else
			{
				$(".buttons").html("");
				$("#Form").html(registerStr);
				$("#showTable").html(instructions);
			}
	};
	
	
////////////////////////////////////////////////////////////////////////////////////////////////	
	var blurFunc= function() 
	{
		var user= storageAPI.getAll("User");
		swal("Hello "+ user[0].id, "Your are successfully registered!", "success")
		$("#Form").addClass("blur");
		$("#showTable").addClass("blur");
		var myVar = setInterval(myTimer, 1500);
		return false;
	};
////////////////////////////////////////////////////////////////////////////////////////////////	
	var myTimer= function() 
	{
		$("#Form").removeClass("blur");
		$("#showTable").removeClass("blur");
		return false;
	};
////////////////////////////////////////////////////////////////////////////////////////////////	
	 return {
        initModule : initModule,
    };
}();


$(document).ready(UserAPI.initModule);