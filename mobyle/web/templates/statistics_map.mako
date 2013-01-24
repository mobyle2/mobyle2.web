<%inherit file="statistics_layout.mako"/>

<div class="row" id="stat-world">
<div id="worldmap"></div>
<script>
$(function(){

  var gdpData = {
  % for location in locations.find():
    "${location['_id']}": ${location['value']},
  % endfor
  };

  $('#worldmap').vectorMap({
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
