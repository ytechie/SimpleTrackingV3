function initMap() {
    if(!latestLocations) {
        return;
    }

    latestLocations = JSON.parse(latestLocations);

    var map = new google.maps.Map(document.getElementById('map'), {});

    var markerBounds = new google.maps.LatLngBounds();

    var marker;
    for(var i=0; i<latestLocations.length; i++) {
        var a = latestLocations[i];

        var point = new google.maps.LatLng(a.lat, a.long);
        
        markerBounds.extend(point);

        new google.maps.Marker({
            position: point,
            map,
            title: ""
        });
    }

    //This sets the zoom and start view
    map.fitBounds(markerBounds);
}