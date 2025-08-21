import stringSimilarity from 'string-similarity';

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
    return process.cwd() + '/src/data/curriculum.csv';
  }

  return process.cwd() + '/src/data/' + csvFileName;
};
