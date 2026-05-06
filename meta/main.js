import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

let data = await loadData();
console.log('Data loaded:', data);

function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/jiangi1/portfolio/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
        Object.defineProperty(ret, 'lines', {
          value: lines,
          enumerable: false,
        });
        return ret;
      });
  }
  
  let commits = processCommits(data);
  console.log('Commits:', commits);

  function renderCommitInfo(data, commits) {
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
    
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
    
    const fileCount = d3.group(data, d => d.file).size;
    dl.append('dt').text('Number of files');
    dl.append('dd').text(fileCount);
    
    const avgFileLength = d3.mean(
      Array.from(d3.group(data, d => d.file).values()),
      lines => d3.max(lines, d => d.line)
    );
    dl.append('dt').text('Average file length');
    dl.append('dd').text(Math.round(avgFileLength));
    
    const deepestLine = d3.max(data, d => d.depth);
    dl.append('dt').text('Maximum depth');
    dl.append('dd').text(deepestLine);
    
    const longestLine = d3.max(data, d => d.length);
    dl.append('dt').text('Longest line (chars)');
    dl.append('dd').text(longestLine);
  }
  
  renderCommitInfo(data, commits);