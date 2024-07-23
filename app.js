const video = document.getElementById('video');
const captureButton = document.getElementById('capture');
const githubToken = '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';

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
        };
    })
    .catch(error => {
        console.error('Error accessing the camera:', error);
    });

let counter = localStorage.getItem('counter') ? parseInt(localStorage.getItem('counter')) : 0;

function updateCounter() {
    counter++;
    localStorage.setItem('counter', counter);
}

async function getShaOfFile(owner, repo, path) {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            headers: {
                'Authorization': `token ${githubToken}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data.sha;
        }
        return null;
    } catch (error) {
        console.error('Error retrieving SHA:', error);
        return null;
    }
}

captureButton.addEventListener('click', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        const reader = new FileReader();
        reader.onloadend = async function() {
            const base64data = reader.result;

            const owner = 'Fangfajun';
            const repo = 'test1';
            const path = `captured-image-${counter}.jpg`; // 更新文件名
            updateCounter();

            let sha = await getShaOfFile(owner, repo, path); // 获取文件的sha值

            fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: "Upload image via web app",
                    content: base64data.split(',')[1],
                    sha: sha, // 只有当文件已存在时才需要这个字段
                    branch: 'main'
                })
            }).then(response => response.json())
                .then(data => {
                    console.log('Image uploaded successfully:', data);
                })
                .catch(error => {
                    console.error('Error uploading image:', error);
                });
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg');
});