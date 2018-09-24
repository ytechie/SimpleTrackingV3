function initMap() {
    if(!trackData) {
        return;
    }

    var map = new google.maps.Map(document.getElementById('map'), {});

    var path = [];
    var markerBounds = new google.maps.LatLngBounds();

    var marker;
    for(var i=0; i<trackData.activity.length; i++) {
        var a = trackData.activity[i];

        if(a.location && a.location.lat) {
            var point = new google.maps.LatLng(a.location.lat, a.location.long);
            path.push(point);
            markerBounds.extend(point);
        }
    }

    var flightPath = new google.maps.Polyline({
        path: path,
        editable: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: map
    });

    //This sets the zoom and start view
    map.fitBounds(markerBounds);
}