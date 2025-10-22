import CampusGuessr from "./CampusGuessr";
import "leaflet/dist/leaflet.css";

export default function App() {
  return (
    <div className="h-screen">
      <CampusGuessr
        target={{ lat: 41.78856635419693, lng: -87.59945524126239 }}
        photoUrl="https://d3qi0qp55mx5f5.cloudfront.net/architecture/i/locations/large_images/Quad_1892_Large.gif.png?mtime=1394829833"
        winRadiusFeet={10}
        maxGuesses={6}
      />
    </div>
  );
}