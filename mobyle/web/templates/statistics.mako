<%inherit file="statistics_layout.mako"/>

<ul class="nav nav-tabs">
  <li class="active">
    <a href="#" id="dashboard" class="dashboard-item">Dashboard</a>
  </li>
</ul>

<div class="row" id="stat-world">
<div id="world-map" style="width: 600px; height: 400px"></div>
<script>
$(function(){

  var gdpData = {
    "AF": 16.63,
    "AL": 11.58,
    "DZ": 158.97,
  };

  $('#world-map').vectorMap({
    map: 'world_mill_en',
    series: {
      regions: [{
        values: gdpData,
        scale: ['#C8EEFF', '#0071A4'],
        normalizeFunction: 'polynomial'
      }]
    },
    onRegionLabelShow: function(e, el, code){
      el.html(el.html()+' ('+gdpData[code]+')');
    }
  });

});

</script>
</div>
