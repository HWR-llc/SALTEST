// global variables
var parameters,
	lineTideFunction,
	lineSaltFunction,
	weirFunction,
	bathyFunction,
	tideSeries;

window.onload = function() {
	parameters = {Sa:1, Na: 0.5,sal:33,fFlow:10 ,b: 5, inv: -1, k:0.25, batTopArea: 40, batMidEl: -5, batMidArea: 25,
				  batBotEl: -15, batBotArea: 10}; 		// set initial parameter values
	createTideChart();				        			// create tide chart
	createSaltChart();
	createFlowControlFigure();
	createBathyFigure();
	bindSliderEvents();			            			// bind slider events
}

function createTideChart() {
	// define size and margins of chart
	var margin = {top: 30, right: 20, bottom: 30, left: 50},
		width = 500,
		height = 300;
	
	// set up x and y scales that values to pixel positions
	var xScale = d3.scale.linear().nice()
		.range([0,width - margin.left - margin.right])
		.domain([0,15]);
	var yScale = d3.scale.linear().nice()
		.range([height - margin.top - margin.bottom, 0])
		.domain([-6, 6]);
		
	// define x and y axes
	var xAxis = d3.svg.axis().orient("bottom").scale(xScale),
		yAxis = d3.svg.axis().orient("left").scale(yScale);
		
	// create line function that maps arrays to pixel locations
	lineTideFunction = d3.svg.line()
		.x(function(d) { return xScale(d[0]);})
		.y(function(d) { return yScale(d[1]);});
		
	// append svg plot in #chart div element
	var svg = d3.select('#tideChart').append('svg')
		.attr("width", width)
		.attr("height", height);
		
	// add container for chart
	var g = svg.append('g')
		.attr("transform",
			"translate("+margin.left+","+margin.top+")");
	// add x axis to chart
	g.append('g').attr('class', 'x axis')
		.attr("transform", "translate(0,"+yScale.range()[0]+")")
		.call(xAxis)
	.append("text")
		.attr("y", 0)
		.attr("x", xScale.range()[1])
		.attr("dy", -5)
		.style("text-anchor", "end")
		.text('Time (days)');
		
	// add y axis to chart
	g.append('g').attr('class','y axis')
		.call(yAxis)
	.append("text")
		.attr("y", 0)
		.attr("x", 5)
		.attr("dy", -5)
		.style("text-anchor", "start")
		.text('WSE (ft msl)');
		
	// add a line to the chart for showing results
	g.append('path')
		.attr('class', 'line');
	
	// update the line with the model output
	updateTideLine();
}

function updateTideLine() {
	// compute model output based on current parameter values
	var data = computeTide(parameters['Sa'], parameters['Na']);
	tideSeries = data;
	
	// select lines and bind new data
	var lines = d3.select("#tideChart").selectAll('.line')
		.data([data]);
	
	// update line elements in svg chart
	lines.attr("d", lineTideFunction);
}

function computeTide(Sa, Na) {
	// array of time points, e.g. [0,.025,0.05,...,28]
	var times = d3.range(0, 28, 0.025);
	
	// empty array to store computed [time, flow] data points
	var results = [];
	
	// tidal constituents values
	var m2sp = 12.56637; //-- rad/day
	var m2ph = 5.541420375; //-- rad
	var s2sp = 12.14079; //-- rad/day
	var s2ph = 6.082472443; //-- rad
	
	// determine amplitude
	var m2amp = Sa - (Na/2);
	var s2amp = (Na/2);
	
	// for each time, compute flow and add [time, flow] to results
	for (var i = 0; i < times.length; i++) {
		var time = times[i];
		var m2 = m2amp * Math.cos(m2sp * time + m2ph);
		var s2 = s2amp * Math.cos(s2sp * time + s2ph);
		var wse = m2 + s2;
		results.push([time,wse]);
	}
	return results;
}

function createFlowControlFigure() {
	// define size and margins of figure
	var //margin = {top: 100, right: 20, bottom: 30, left: 50},
		width = 200,
		height = 300;
	
	// Make a svg Container
	var weirContainer = d3.select("#flowFig").append("svg")
							.attr("width",width)
							.attr("height",height);
							
	weirFunction = d3.svg.line()
							.x(function(d) {return d.x; })
							.y(function(d) {return d.y; })
							.interpolate("linear");
							
	var weirLine = weirContainer.append("path")
							.attr('class','weirBot');
							
	var weirPoly = weirContainer.append("path")
							.attr('class','weirWat');
							
	updFlowControlFigure(parameters['inv'], parameters['b']);
}

function updFlowControlFigure(inv, b) {
	// determine scale drawing based on inputs
	var xStart = 30,
		xEnd = 170,
		xMid = 100;
	var scWidth = (b/10) * 140; // scaled width assuming 300 px diagram
	var xLeft = 100 - (scWidth/2);
	var xRight = 100 + (scWidth/2);	
	var Top = 20; 
	var scBot = 30 + (inv/-25) * 250; 
	var scWat = 30;
	var xWatOffset = (((scBot-scWat)/(scBot-Top))*(xLeft-xStart))
	var midXLeft = xLeft - xWatOffset;
	var midXRight = xRight + xWatOffset;
	
	// points along line
	var weirLiData = [ 	{"x":xStart, "y":Top},
						{"x":xLeft, "y":scBot},
						{"x":xRight, "y":scBot},
						{"x":xEnd, "y":Top}	];	
						
	var weirPolyData = [{"x":midXLeft, "y":scWat},
						{"x":xLeft, "y":scBot},
						{"x":xRight, "y":scBot},
						{"x":midXRight, "y":scWat}];
						
	// select line or poly to bind new data
	var lines = d3.select('.weirBot')
	var poly = d3.select('.weirWat')
						
	poly.attr("d", weirFunction(weirPolyData))
		.attr("stroke","blue")
		.attr("stroke-width",1)
		.attr("fill","blue")
		.attr("opacity",0.5);

	lines.attr("d", weirFunction(weirLiData))
		.attr("stroke","black")
		.attr("stroke-width",3)
		.attr("fill","none");
}

function createBathyFigure() {
	// define size and margins of figure
	var //margin = {top: 100, right: 20, bottom: 30, left: 50},
		width = 400,
		height = 300;
	
	// Make a svg Container
	var bathyContainer = d3.select("#bathyFig").append("svg")
							.attr("width",width)
							.attr("height",height);
							
	bathyFunction = d3.svg.line()
							.x(function(d) {return d.x; })
							.y(function(d) {return d.y; })
							.interpolate("basis");
							
	var estBottom = bathyContainer.append("path")
							.attr('class','estBot');
							
	var estPoly = bathyContainer.append("path")
							.attr('class','estWat');
							
	updBathyFigure(parameters['Sa'],parameters['batTopArea'],parameters['batMidEl'],parameters['batMidArea'],
					parameters['batBotEl'],parameters['batBotArea']);
}

function updBathyFigure(batTopEl,batTopArea,batMidEl,batMidArea,batBotEl,batBotArea) {
	// determine scale drawing based on inputs
	// starting and ending points
	var xStart = 10,
		yStart = 10,
		xEnd = 390,
		yEnd = 10;
	
	// vertical levels
	var yTop = 30+((5-batTopEl)/25)*250;
	var yMid = 30+((5-batMidEl)/25)*250;
	var yBot = 30+((5-batBotEl)/25)*250;
	// horizontal  widths
	var widTop = (batTopArea/50)*360;
	var widMid = (batMidArea/50)*360;
	var widBot = (batBotArea/50)*360;
	
	// mid-points
	vCenter = 200;
	hCenter = 200;
	
	// points list X
	var x2 = hCenter - widTop/2,
		x3 = hCenter - widMid/2,
		x4 = hCenter - widBot/2,
		x5 = hCenter + widBot/2,
		x6 = hCenter + widMid/2,
		x7 = hCenter + widTop/2;
	// points list Y
	var y2 = yTop,
		y3 = yMid,
		y4 = yBot,
		y5 = yBot,
		y6 = yMid,
		y7 = yTop;

	// points along line
	var bathyLiData = [	{"x":xStart, "y":yStart},
						{"x":x2, "y":y2},
						{"x":x3, "y":y3},
						{"x":x4, "y":y4},
						{"x":x5, "y":y5},
						{"x":x6, "y":y6},
						{"x":x7, "y":y7},
						{"x":xEnd, "y":yEnd}	];	
						
	// select line to bind new data
	var lines = d3.select('.estBot');
	
	lines.attr("d", bathyFunction(bathyLiData))
		.attr("stroke","black")
		.attr("stroke-width",2)
		.attr("fill","none");
		
	var linesInterp = lines.node();
	
	// piece of code taken from: http://stackoverflow.com/questions/11503151/in-d3-how-to-get-the-interpolated-line-data-from-a-svg-line
	// accessed October 7, 2014 and modified to find X given a Y
	var findXatYbyBisection = function(y, path, error){
		var length_end = path.getTotalLength()
			, length_start = 0
			, point = path.getPointAtLength((length_end + length_start) / 2) // get the middle point
			, bisection_iterations_max = 50
			, bisection_iterations = 0

		error = error || 0.01

		while (y < point.y - error || y > point.y + error) {
			// get the middle point
			point = path.getPointAtLength((length_end + length_start) / 2)

			if (y < point.y) {
				length_end = (length_start + length_end)/2
			} else {
				length_start = (length_start + length_end)/2
			}

			// Increase iteration
			if(bisection_iterations_max < ++ bisection_iterations)
				break;
		}
		return point.x
	}
	var xScWatLeft = findXatYbyBisection(30,linesInterp,0.1);
	var yScWat = 30;
	var xScWatRight = (200 - xScWatLeft) + 200;

	
	var bathyPolyData = [{"x":xScWatLeft, "y":yScWat},
						{"x":x2, "y":y2},
						{"x":x3, "y":y3},
						{"x":x4, "y":y4},
						{"x":x5, "y":y5},
						{"x":x6, "y":y6},
						{"x":x7, "y":y7},
						{"x":xScWatRight, "y":yScWat}	];	
						
	var poly = d3.select('.estWat')
						
	poly.attr("d", bathyFunction(bathyPolyData))
		.attr("stroke","blue")
		.attr("stroke-width",1)
		.attr("fill","blue")
		.attr("opacity",0.5);


}

function createSaltChart() {
	// define size and margins of chart
	var margin = {top: 30, right: 20, bottom: 30, left: 50},
		width = 500,
		height = 300;
	
	// set up x and y scales that values to pixel positions
	var xScale = d3.scale.linear().nice()
		.range([0,width - margin.left - margin.right])
		.domain([0,15]);
	var yScale = d3.scale.linear().nice()
		.range([height - margin.top - margin.bottom, 0])
		.domain([-5, 5]); //**********Scale for y-axis*************
		
	// define x and y axes
	var xAxis = d3.svg.axis().orient("bottom").scale(xScale),
		yAxis = d3.svg.axis().orient("left").scale(yScale);
		
	// create line function that maps arrays to pixel locations
	lineSaltFunction = d3.svg.line()
		.x(function(d) { return xScale(d[0]);})
		.y(function(d) { return yScale(d[1]);});
		
	// append svg plot in #chart div element
	var svg = d3.select('#saltChart').append('svg')
		.attr("width", width)
		.attr("height", height);
		
	// add container for chart
	var g = svg.append('g')
		.attr("transform",
			"translate("+margin.left+","+margin.top+")");
	// add x axis to chart
	g.append('g').attr('class', 'x axis')
		.attr("transform", "translate(0,"+yScale.range()[0]+")")
		.call(xAxis)
	.append("text")
		.attr("y", 0)
		.attr("x", xScale.range()[1])
		.attr("dy", -5)
		.style("text-anchor", "end")
		.text('Time (days)');
		
	// add y axis to chart
	g.append('g').attr('class','y axis')
		.call(yAxis)
	.append("text")
		.attr("y", 0)
		.attr("x", 5)
		.attr("dy", -5)
		.style("text-anchor", "start")
		.text('Salinity (ppt)');
		
	// add a line to the chart for showing results
	g.append('path')
		.attr('class', 'line');
	
	// update the line with the model output
	updateSaltLine();
}

function updateSaltLine() {
	// compute model output based on current parameter values
	var data = computeSalt(tideSeries, parameters['inv'], parameters['k'], parameters['fFlow'],
							parameters['sal']);

	// select lines and bind new data
	var lines = d3.select("#saltChart").selectAll('.line')
		.data([data]);
	
	// update line elements in svg chart
	lines.attr("d", lineSaltFunction);
}

function computeSalt(tide, inv, k, Qfr, sal) {
	//function for linear interpolation from array
	function linInterp(xVal, xRange, yRange) {
		var scale = d3.scale.linear()
			.domain(xRange)
			.range(yRange);
		var yVal = scale(xVal);
		return yVal;
	}
	//format data needed for calculation of water level and salinity
	//estuary data
	var pondEls = [parameters['Sa'] + parameters['Na'],parameters['batMidEl'],parameters['batBotEl']];
	var pondAs = [parameters['batTopArea'],parameters['batMidArea'],parameters['batBotArea']];
	for (var i = 0; i<pondAs.length; i++) { //function to convert area in acres to square feet
		pondAs[i]*=43560; //43,560 square feet in an acre
	}

	//open water tide data
	var time = [],
		tideWL = [];
	
	for (var i = 0; i<tide.length; i++) {
		tTimeWL = tide[i];
		time.push(tTimeWL[0]);
		tideWL.push(tTimeWL[1]);
	}

	
	//define model terms and initial conditions
	var delT=0.05; //timestep
	var pondWL_0 = tideWL[0]; //initial condition
	var pondSal_0 = 20; //initial condition pond salinity in ppt 
	
	//declare model result variables
	var pondWL = [];
	pondWL.push([0,pondWL_0]);
	var pondSal = [];
	pondSal[0] = pondSal_0;
	
	//declare temporary variables
	var tideWL_Int = 0,
		pondA_Int = 0,
		pondWL_Int = 0,
		head_Int = 0,
		K1Time = 0,
		K2Time = 0,
		K2Step = 0,
		K3Time = 0,
		K3Step = 0,
		flowDir = 1;
		
	//Runge-Kutta term variables
	var K1 = 0,
		K2 = 0,
		K3 = 0;

	//begin calculation using Runge-Kutta solution
	var totTimesteps = Math.max(time) / delT;
	var testArr = [0,1,2,3,4,5];
	console.log(Math.max(testArr));

	for (var i = 0; i < totTimesteps; i++) {
		pondWL_Int = pondWL[i];
		K1Time = PondWL_Int[0];//current time step in days
		pondWL_Int = pondWL_Int[1];
		//interpolate open water level at t
		tideWL_Int = linInterp(K1Time, time, tideWL);
		//interpolate pond area at t
		pondA_Int = linInterp(pondWL[i], pondEls, pondAs);
		//Calculate R-K term K1		
		head_Int = tideWL_Int - pondWL[i]; //+ is flowing into pond - is flowing out of pond
		if(head_Int < 0) {
			flowDir=-1;
		} else {
			flowDir=1;
		}
		K1 = (((parameter['k'] * parameter['b'] * (Math.abs(head_Int) ^-1.5)) + Qfr) * 86400) / pondA_Int;
		
		K2Time = K1Time + delT/2;
		//interpolate open water level at t + delT/2
		tideWL_Int = linInterp(K2Time, time, tideWL);
		K2Step = pondWL[i] + K1 * delT / 2;
		//interpolate pond area at t + delT/2
		pondA_Int = linInterp(K2Step, pondEls, pondAs);
		//Calculate R-K term K2		
		head_Int = tideWL_Int - K2Step; //+ is flowing into pond - is flowing out of pond
		if(head_Int < 0) {
			flowDir=-1;
		} else {
			flowDir=1;
		}		
		K2 = (((parameter['k'] * parameter['b'] * (Math.abs(head_Int) ^-1.5)) + Qfr) * 86400) / pondA_Int;
		
		K3Time = K1Time + delT;
		//interpolate open water level at t + delT
		tideWL_Int = linInterp(K3Time, time, tideWL);
		K3Step = pondWL[i] - K1 * delT + 2 * K2 * delT;
		//interpolate pond area at t + delT
		pondA_Int = linInterp(K3Step, pondEls, pondAs);
		//Calculate R-K term K3		
		head_Int = tideWL_Int - K3Step; //+ is flowing into pond - is flowing out of pond
		if(head_Int < 0) {
			flowDir=-1;
		} else {
			flowDir=1;
		}		
		K3 = (((parameter['k'] * parameter['b'] * (Math.abs(head_Int) ^-1.5)) + Qfr) * 86400) / pondA_Int;		
		pondWL_New = pondWL[i] + (1/6) * (K1 + 4 * K2 +K3) * delT;
		pondWL.push([K3Time,pondWL_New]);
	}

	return pondWL;
}

function bindSliderEvents() {
	// for each slider, bind input event to update chart
	d3.selectAll(".slider").on("input", function () {
		
		// update slider label with current value
		d3.selectAll("#param-"+this.name).text(this.value);

		// set value in parameters object
		parameters[this.name] = +this.value;
		// update tide chart with new parameters
		updateTideLine();
		// update salinity chart with new parameters
		updateSaltLine();
		// update Flow Figure
		updFlowControlFigure(parameters['inv'], parameters['b']);
		// update Bathy Figure
		updBathyFigure(parameters['Sa'],parameters['batTopArea'],parameters['batMidEl'],
						parameters['batMidArea'],parameters['batBotEl'],parameters['batBotArea']);
	});
}