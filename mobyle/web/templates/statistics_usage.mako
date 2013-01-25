<%inherit file="statistics_layout.mako"/>

<div id="chart_container">
<div id="y_axis"></div>
<div id="chart"></div> 
</div>
 
<script> 
$(function() { 

var graph = new Rickshaw.Graph( {
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
