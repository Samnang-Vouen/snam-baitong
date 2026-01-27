import CropCard from './CropCard';

export default function CropGrid({ crops }) {
  if (!crops || !crops.length) {
    return (
      <div className="alert alert-secondary" role="alert">
        No crops available yet.
      </div>
    );
  }

  return (
    <div className="row">
      {crops.map((crop) => (
        <div key={crop.id} className="col-md-6 col-lg-4 mb-4">
          <CropCard crop={crop} />
        </div>
      ))}
    </div>
  );
}