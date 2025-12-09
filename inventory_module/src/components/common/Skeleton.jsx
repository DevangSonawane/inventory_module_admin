const Skeleton = ({ className = '', lines = 1 }) => {
  if (lines === 1) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={`animate-pulse bg-gray-200 rounded ${className}`} />
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;









