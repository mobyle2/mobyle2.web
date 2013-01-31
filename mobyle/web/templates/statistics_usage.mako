<%inherit file="statistics_layout.mako"/>

% if type!="hour":
<div class="row">
<div class="span2">
<button class="btn btn-primary" id="refresh">Refresh</button>
</div>
<div class="span4">
<form class="form-inline">
<label for="fromdate">From&nbsp;</label><input type="text" id="fromdate" />
</form>
</div>
<div class="span4">
<form class="form-inline">
<label for="todate">To&nbsp;</label><input type="text" id="todate" />
</form>
</div>
</div>
% endif

<div id="chart_container">
<div id="y_axis"></div>
<div id="chart"></div> 
</div>
 
<script> 

var graph = null;

$(function() { 

$( "#fromdate" ).datepicker();
$( "#todate" ).datepicker();

$('#refresh').click(function(event) {
    var route = "/admin/stats/usage.json?type=${type}";
    fromdate = $('#fromdate').val();
    todate = $('#todate').val();
    if(fromdate!="") { route +="&fromdate="+fromdate; }
    if(todate!="") { route +="&todate="+todate; }
    $.getJSON(route, function(data) {
      graph.series[0] = data[0];
      graph.update();
    });

});


graph = new Rickshaw.Graph( {
    element: document.querySelector("#chart"), 
    width: 800, 
    height: 600, 
    series: [{
        name: 'Jobs',
        color: 'steelblue',
        data: [ 
    % for usage in usages:
    <%
      import time
      timestamp = time.mktime(usage['timestamp'].timetuple())
    %>
            { x: ${timestamp}, y: ${usage['total']} },

    % endfor
            ]
    }]
});


/*
var graph = new Rickshaw.Graph.Ajax( {

	element: document.querySelector("#chart"),
	width: 800,
	height: 600,
	dataURL: '/admin/stats/usage.json?type=${type}',
	onData: function(d) { return d;  },
	series: [
		{
			name: 'Jobs',
			color: 'steelblue',
		}
	],
} );
*/



var hoverDetail = new Rickshaw.Graph.HoverDetail( {
    graph: graph
} );




graph.render();

var time = new Rickshaw.Fixtures.Time();
var units = time.unit('${type}');

var xAxis = new Rickshaw.Graph.Axis.Time({
    graph: graph,
    timeUnit: units
});

xAxis.render();


var yAxis = new Rickshaw.Graph.Axis.Y( {
        graph: graph,
        orientation: 'left',
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        element: document.getElementById('y_axis'),
} );


yAxis.render();




 });
 
</script> 
