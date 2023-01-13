import { ProjectsInterface } from '@interfaces/projects'

const template = (data: Partial<ProjectsInterface>) => {
	// TODO: Add html template once its ready
	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Document</title>
	</head>
	<body>
		<h1 style="color: red">hello this is sample for test</h1>
		<p>Project Name: ${data.title}</p>
		<p>country: ${data.title}</p>
		<img src="https://cdn.pixabay.com/photo/2014/02/27/16/10/flowers-276014__340.jpg" alt="image" />
	</body>
</html>`
}

export default template
