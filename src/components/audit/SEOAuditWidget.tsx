{/* Technical Analysis */}
<div className="bg-white rounded-lg shadow p-6">
<h3 className="text-lg font-semibold mb-4">Technical SEO</h3>
<div className="grid grid-cols-2 gap-4">
  <div>
    <p className="font-medium">SSL Security</p>
    <p className={`text-sm ${results.technical?.ssl ? 'text-green-600' : 'text-red-600'}`}>
      {results.technical?.ssl ? 'Secure' : 'Not Secure'}
    </p>
  </div>
  <div>
    <p className="font-medium">Robots.txt</p>
    <p className={`text-sm ${results.robotsTxt?.exists ? 'text-green-600' : 'text-yellow-600'}`}>
      {results.robotsTxt?.exists ? 'Present' : 'Missing'}
    </p>
  </div>
  <div>
    <p className="font-medium">Sitemap</p>
    <p className={`text-sm ${results.sitemap?.exists ? 'text-green-600' : 'text-yellow-600'}`}>
      {results.sitemap?.exists ? `Present (${results.sitemap.urlCount} URLs)` : 'Missing'}
    </p>
  </div>
  <div>
    <p className="font-medium">Page Load Time</p>
    <p className="text-sm">{results.performance?.loadTime || 'N/A'}ms</p>
  </div>
</div>
</div>

{/* Issues */}
<div className="bg-white rounded-lg shadow p-6">
<h3 className="text-lg font-semibold mb-4">Issues Found</h3>
<div className="space-y-4">
  {results.seo.issues.map((issue, index) => (
    <div
      key={index}
      className={`p-4 rounded-lg ${
        issue.severity === 'critical' ? 'bg-red-50' :
        issue.severity === 'warning' ? 'bg-yellow-50' :
        'bg-blue-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-medium">{issue.type}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
          issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {issue.severity}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{issue.description}</p>
    </div>
  ))}
</div>
</div>

{/* Action Button */}
<div className="text-center">
<button
  onClick={() => setAuditStatus('idle')}
  className="px-6 py-3 bg-[#ff9270] text-white rounded-md hover:bg-opacity-90"
>
  Run Another Audit
</button>
</div>
</div>
)}

{auditStatus === 'error' && (
<div className="text-center">
<AlertCircle className="w-16 h-16 mx-auto text-red-500" />
<h2 className="mt-4 text-xl font-semibold text-red-700">Error</h2>
<p className="mt-2 text-red-600">
{errorMessage || 'An error occurred while analyzing your website.'}
</p>
</div>
)}
</div>
</div>
);
};

export default SEOAuditWidget;