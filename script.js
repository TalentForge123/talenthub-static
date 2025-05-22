// Main script for TalentForge Landing Page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize upload areas
    initializeUploadArea('employee');
    initializeUploadArea('job');
    initializeUploadArea('candidate');
    
    // Initialize sample file links
    document.getElementById('employeeSampleLink').addEventListener('click', function() {
        downloadSampleFile('employee');
    });
    
    document.getElementById('jobSampleLink').addEventListener('click', function() {
        downloadSampleFile('job');
    });
    
    document.getElementById('candidateSampleLink').addEventListener('click', function() {
        downloadSampleFile('candidate');
    });
    
    // Initialize Softr.io links
    const softrLinks = document.querySelectorAll('.softr-link');
    softrLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            window.open(url, '_blank');
        });
    });
});

// Initialize upload area functionality
function initializeUploadArea(type) {
    const uploadArea = document.getElementById(`${type}UploadArea`);
    const fileInput = document.getElementById(`${type}FileInput`);
    const progressContainer = document.getElementById(`${type}UploadProgressContainer`);
    const progressBar = document.getElementById(`${type}UploadProgressBar`);
    const percentageText = document.getElementById(`${type}UploadPercentage`);
    const successMessage = document.getElementById(`${type}SuccessMessage`);
    const errorMessage = document.getElementById(`${type}ErrorMessage`);
    const errorText = document.getElementById(`${type}ErrorText`);
    
    // Click on upload area to trigger file input
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFileUpload(this.files[0], type);
        }
    });
    
    // Handle drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('border-primary');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('border-primary');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('border-primary');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0], type);
        }
    });
    
    // Function to handle file upload
    function handleFileUpload(file, type) {
        // Check file type
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileName = file.name;
        const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            showError(`Invalid file type. Please upload a CSV or Excel file.`);
            return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError(`File size exceeds 10MB limit.`);
            return;
        }
        
        // Reset UI
        resetUI();
        
        // Show progress
        progressContainer.style.display = 'block';
        
        // Read file
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Update progress to 50% for file read completion
                updateProgress(50);
                
                let csvData;
                if (fileExtension === '.csv') {
                    csvData = e.target.result;
                } else {
                    // For Excel files, we would need a library like SheetJS
                    // This is a placeholder for Excel handling
                    showError(`Excel files are not supported yet. Please use CSV format.`);
                    return;
                }
                
                // Process CSV data
                const records = window.airtableClient.processCSVForUpload(csvData, type);
                
                // Update progress to 75% for processing completion
                updateProgress(75);
                
                // Send to Airtable
                try {
                    const result = await window.airtableClient.sendData(type + 's', records);
                    console.log('Upload result:', result);
                    
                    // Update progress to 100% for upload completion
                    updateProgress(100);
                    
                    // Show success message
                    successMessage.style.display = 'block';
                    
                    // Add to upload history
                    addToHistory(file.name, formatFileSize(file.size), new Date().toLocaleString(), 'Success');
                    
                    // Show upload history
                    document.getElementById(`${type}UploadHistory`).style.display = 'block';
                } catch (error) {
                    console.error('Error uploading to Airtable:', error);
                    showError(`Error uploading to Airtable: ${error.message}`);
                    
                    // Add to upload history
                    addToHistory(file.name, formatFileSize(file.size), new Date().toLocaleString(), 'Failed');
                    
                    // Show upload history
                    document.getElementById(`${type}UploadHistory`).style.display = 'block';
                }
            } catch (error) {
                console.error('Error processing file:', error);
                showError(`Error processing file: ${error.message}`);
            }
        };
        
        reader.onerror = function() {
            showError(`Error reading file.`);
        };
        
        // Read as text for CSV
        reader.readAsText(file);
    }
    
    // Helper function to update progress
    function updateProgress(percentage) {
        progressBar.style.width = `${percentage}%`;
        percentageText.textContent = `${percentage}%`;
    }
    
    // Helper function to show error
    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        progressContainer.style.display = 'none';
    }
    
    // Helper function to reset UI
    function resetUI() {
        progressBar.style.width = '0%';
        percentageText.textContent = '0%';
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
    }
    
    // Helper function to add to upload history
    function addToHistory(fileName, fileSize, date, status) {
        const historyBody = document.getElementById(`${type}HistoryBody`);
        const row = document.createElement('tr');
        
        const statusClass = status === 'Success' ? 'text-success' : 'text-danger';
        
        row.innerHTML = `
            <td>${fileName}</td>
            <td>${fileSize}</td>
            <td>${date}</td>
            <td class="${statusClass}">${status}</td>
        `;
        
        historyBody.prepend(row);
    }
}

// Function to download sample file
function downloadSampleFile(type) {
    // Sample data for each type
    const sampleData = {
        employee: `Employee ID,First Name,Last Name,Position,Department,Location,Hire Date,Salary,Manager ID,Age,Gender,Education,Years Experience,Performance Rating,Risk of Leaving,Skills
1001,John,Smith,Production Line Worker,Manufacturing,Plant A,2018-05-15,32000,2001,34,Male,High School,6,3.7,Medium,"Assembly, Quality Control"
1002,Jane,Doe,Senior Engineer,R&D,Headquarters,2015-11-03,65000,2002,41,Female,Masters,12,4.5,Low,"CAD Design, Mechanical Engineering, Project Management"
1003,Michael,Johnson,Quality Inspector,Quality Assurance,Plant B,2019-02-28,38000,2003,29,Male,Bachelors,5,3.9,Low,"Quality Standards, Testing Procedures"`,
        
        job: `Job ID,Title,Department,Location,Required Skills,Minimum Education,Minimum Experience,Salary Range Min,Salary Range Max,Priority Level
J001,Production Supervisor,Manufacturing,Plant A,"Team Leadership, Process Optimization, Quality Control",Bachelors,5,45000,55000,High
J002,Mechanical Engineer,Engineering,Headquarters,"CAD Design, Mechanical Engineering, Product Development",Masters,3,55000,70000,Medium
J003,Quality Analyst,Quality Assurance,Plant B,"Quality Standards, Testing Procedures, Documentation",Bachelors,2,35000,45000,Low`,
        
        candidate: `Candidate ID,First Name,Last Name,Position Applied,Department,Location Preference,Application Date,Expected Salary,Age,Gender,Education,Years Experience,Skills,Interview Score,Status
C001,Robert,Williams,Production Supervisor,Manufacturing,Plant A,2023-04-15,50000,36,Male,Bachelors,8,"Team Leadership, Process Optimization, Quality Control",4.2,In Process
C002,Emily,Brown,Mechanical Engineer,Engineering,Headquarters,2023-04-10,60000,29,Female,Masters,5,"CAD Design, Mechanical Engineering, Product Development",3.9,In Process
C003,David,Miller,Quality Analyst,Quality Assurance,Plant B,2023-04-05,40000,31,Male,Bachelors,4,"Quality Standards, Testing Procedures, Documentation",4.5,In Process`
    };
    
    // Create blob and download
    const blob = new Blob([sampleData[type]], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${type}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// Function to redirect to Softr.io application
function redirectToSoftr(page) {
    const baseUrl = 'https://erick39226.preview.softr.app';
    let pageUrl = baseUrl;
    
    switch(page) {
        case 'admin':
            pageUrl = `${baseUrl}/admin-view`;
            break;
        case 'employee':
            pageUrl = `${baseUrl}/employee-view`;
            break;
        case 'candidate':
            pageUrl = `${baseUrl}/candidate-landing-page`;
            break;
        case 'dashboard':
            pageUrl = `${baseUrl}/manager-dashboard-copy`;
            break;
        default:
            pageUrl = baseUrl;
    }
    
    window.open(pageUrl, '_blank');
}
