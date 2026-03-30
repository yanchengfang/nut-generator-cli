import inquirer from "inquirer";

export const inquirerConfirm = async (message) => {
  const answer = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message
  });
  return answer;
}

export const inquirerChoose = async (message, choices, type = 'rawlist') => {
  const answer = await inquirer.prompt({
    type,
    name: "choose",
    message,
    choices
  });
  return answer;
}

export const inquirerInputs = async (message) => {
  const answer = await inquirer.prompt(message.map((item) => ({
    type: "input",
    name: item.name,
    message: item.message
  })));
  return answer;
}