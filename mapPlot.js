export class MapPlot {
    constructor(domElement) {
        this.domElement = domElement;
        this.marker = null;
        this.map = null;
    }

    init(lats, lons) {
        this.lats = lats;
        this.lons = lons;

        let middle = Math.floor(lats.length / 2);
        var bounds = new google.maps.LatLngBounds();

        this.map = new google.maps.Map(this.domElement, {
            center: { lat: lats[middle], lng: lons[middle] },
            zoom: 12,
        });

        let pathCoords = [];
        for (let i = 0; i < lats.length; i++) {
            let pos = { lat: lats[i], lng: lons[i] };
            pathCoords.push(pos);
            bounds.extend(pos);
        }

        const path = new google.maps.Polyline({
            path: pathCoords,
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2,
        });

        path.setMap(this.map);

        this.map.setCenter(bounds.getCenter());
        this.map.fitBounds(bounds);
    }

    setMarker(lat, lon, cog) {
        if (this.marker != null) {
            this.marker.setMap(null);
        }

        this.marker = new google.maps.Marker({
            position: { lat: lat, lng: lon },
            icon: {
                path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                scale: 4,
                rotation: cog
            },
            draggable: true,
            map: this.map,
        });
    }

    // Zoom in on a section of lats and lons
    setZoom(start_idx, end_idx) {
        var bounds = new google.maps.LatLngBounds();
        for (let i = start_idx; i < end_idx; i++) {
            let pos = { lat: this.lats[i], lng: this.lons[i] };
            bounds.extend(pos);
        }
        this.map.setCenter(bounds.getCenter());
        this.map.fitBounds(bounds);
    }
}