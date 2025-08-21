import stringSimilarity from 'string-similarity';
import path from 'path';
import fs from 'fs';

// Helper function to resolve data file path
const getDataFilePath = (fileName: string): string => {
  // Try different possible paths
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'data', fileName),
    path.join(process.cwd(), 'src', 'data', fileName), 
    path.join(__dirname, '..', '..', 'public', 'data', fileName),
    path.join(__dirname, '..', '..', 'src', 'data', fileName),
    // For production builds
    path.join('/var/task', 'public', 'data', fileName),
    path.join('/var/task', 'src', 'data', fileName),
  ];

  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`📁 Found data file at: ${filePath}`);
        return filePath;
      }
    } catch (error) {
      // Continue to next path
    }
  }

  // Fallback to public/data path (most likely to work in production)
  const fallbackPath = path.join(process.cwd(), 'public', 'data', fileName);
  console.warn(`⚠️ Could not find ${fileName}, using fallback: ${fallbackPath}`);
  return fallbackPath;
};

export const getSubjectCSVPath = (subject: string): string => {
  const subjectMapping: { [key: string]: string } = {
    'คณิตศาสตร์': 'math.csv',
    'วิทยาศาสตร์': 'science.csv', 
    'ภาษาไทย': 'thai.csv',
    'ภาษาอังกฤษ': 'english.csv',
    'สุขศึกษา': 'health.csv',
    'สังคมศึกษา': 'social_study.csv',
    'ศิลปะ': 'art.csv',
    'การงานอาชีพ': 'career_academic.csv'
  };

  // Direct match first
  let csvFileName = subjectMapping[subject];
  
  // If no direct match, try fuzzy matching
  if (!csvFileName) {
    const subjects = Object.keys(subjectMapping);
    const matches = stringSimilarity.findBestMatch(subject, subjects);
    
    if (matches.bestMatch.rating > 0.6) { // 60% similarity threshold
      csvFileName = subjectMapping[matches.bestMatch.target];
      console.log(`📝 Fuzzy matched "${subject}" to "${matches.bestMatch.target}" (${Math.round(matches.bestMatch.rating * 100)}% similarity)`);
    }
  }

  if (!csvFileName) {
    console.warn(`⚠️ No matching subject found for: ${subject}, using general curriculum`);
    return getDataFilePath('curriculum.csv');
  }

  return getDataFilePath(csvFileName);
};
