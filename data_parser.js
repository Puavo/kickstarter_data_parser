const csv = require('fast-csv');
const allBackedProjets = require('./backed_projects');

/*
 * Add project ids for projects you do not
 * want to include in your analysis.
 * e.g. 1814085072
 */
const nonBoardGameProjects = [

];

/*
 * To make numbers unbiased, add delivery estimate
 * to projects whose initial delivery estimate is in 
 * the past, but have not yeyt been delivered. You can 
 * also use this to override values coming from KS.
 * 
 * format:
 * project_id as number: dateString
 * e.g.
 * 1814085072: '2023-01-01'
 */
const deliveryEstimates = {
}

const dataMapper = project => {
    const launchDate = new Date(project.launched_at);
    const deadlineDate = new Date(project.deadline);
    const deliveryDate = project.marked_received_at ? new Date(project.marked_received_at) : false;
    const estimatedDeliveryDate = new Date(project.reward.estimated_delivery_on);
    return {
        name: project.name,
        launchDate: launchDate.toISOString(),
        deadlineMonth: deadlineDate.getMonth() + 1,
        deadlineYear: deadlineDate.getFullYear(),
        estimatedDeliveryYear: estimatedDeliveryDate.getFullYear(),
        estimatedDeliveryMonth: estimatedDeliveryDate.getMonth() + 1,
        deliveryAccuracyInMonths: (deliveryDate.getFullYear() - estimatedDeliveryDate.getFullYear()) * 12 + (deliveryDate.getMonth() - estimatedDeliveryDate.getMonth()),
        price: project.pledge_amount,
        currency: project.project_currency,
    }
}

let backedSuccesfulProjects = allBackedProjets
    // Remove unsuccesful projects
    .filter(project => project.project_status === 'successful')
    // Remove unwanted projects
    .filter(project => !nonBoardGameProjects.includes(project.pid));

// Handle delivery estimates
backedSuccesfulProjects = backedSuccesfulProjects.map(project => {
    if (deliveryEstimates[project.pid]) {
        project.marked_received_at = deliveryEstimates[project.pid];
    }
    return project;
});
    
// Remove undelivered projects without delivery estimate
backedSuccesfulProjects = backedSuccesfulProjects.filter(project => {
    if (!project.marked_received_at && (new Date(project.reward.estimated_delivery_on)).getTime() < Date.now()) {
        console.log(`${project.name} (${project.pid}) is not delivered. Estimated delivery date is ${project.reward.estimated_delivery_on}.`);
    }
    return !!project.marked_received_at;
});

const mappedData = backedSuccesfulProjects.map(dataMapper);
const csvOptions = {
    headers: true,
}
csv.writeToPath('./backed_projects.csv', mappedData, csvOptions);