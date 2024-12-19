/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/// <reference types="cypress" />

import {
    click,
    clickByText,
    inputText,
    selectFilter,
    selectItemsPerPage,
    selectUserPerspective,
} from "../../../../utils/utils";
import {
    SEC,
    TaskKind,
    TaskStatus,
    itemsPerPage,
    migration,
    TaskFilter,
    trTag,
    MIN,
} from "../../../types/constants";
import { analysisDetailsEditor } from "../../../views/analysis.view";
import { sideKebabMenu } from "../../../views/applicationinventory.view";
import {
    actionMenuItem,
    kebabActionButton,
    searchButton,
    searchInput,
} from "../../../views/common.view";
import { navMenu } from "../../../views/menu.view";
import { TaskManagerColumns, tasksStatusColumn } from "../../../views/taskmanager.view";

export class TaskManager {
    static fullUrl = Cypress.env("tackleUrl") + "/tasks";
    static menuName = "Task Manager";

    static open(itemsPerPage = 100, forceReload = false) {
        if (forceReload) {
            cy.visit(TaskManager.fullUrl, { timeout: 15 * SEC }).then((_) =>
                selectItemsPerPage(itemsPerPage)
            );
            return;
        }

        cy.url().then(($url) => {
            if (!$url.includes(TaskManager.fullUrl)) {
                selectUserPerspective(migration);
                clickByText(navMenu, this.menuName);
                cy.get("h1", { timeout: 60 * SEC }).should("contain", this.menuName);
            }
        });
        selectItemsPerPage(itemsPerPage);
    }

    static verifyTaskStatus(application: string, kind: TaskKind, status: TaskStatus): void {
        TaskManager.open();
        selectItemsPerPage(itemsPerPage);
        cy.get(trTag)
            .filter(':contains("' + application + '")')
            .filter(':contains("' + kind + '")')
            .within(() => {
                cy.get(tasksStatusColumn).contains(status, { timeout: 30 * SEC });
            });
    }

    public static applyFilter(filterType: TaskFilter, filterValue: string) {
        selectFilter(filterType);
        inputText(searchInput, filterValue);
        click(searchButton);
        cy.wait(2 * SEC);
    }

    public static setPreemption(preemption: boolean): void {
        const setPreemption = preemption === true ? "Enable preemption" : "Disable preemption";

        TaskManager.open(10);
        cy.contains("Pending")
            .closest(trTag)
            .within(() => {
                click(sideKebabMenu);
            });
        cy.get(actionMenuItem).contains(setPreemption).click();
    }

    public static cancelTask(status: string): void {
        TaskManager.open(10);
        cy.contains(status)
            .closest(trTag)
            .within(() => {
                click(sideKebabMenu);
            });
        if (
            status == TaskStatus.pending ||
            status == TaskStatus.running ||
            status == TaskStatus.ready ||
            status == TaskStatus.postponed
        ) {
            cy.get(actionMenuItem).contains("Cancel").click();
        } else {
            cy.get(actionMenuItem).contains("Cancel").should("not.be.enabled");
        }
    }

    public static cancelAnalysisByStatus(
        appName: string,
        status: TaskStatus,
        enabled = true
    ): void {
        TaskManager.open();
        selectItemsPerPage(itemsPerPage);
        cy.get(trTag)
            .filter(':contains("' + TaskKind.analyzer + '")')
            .filter(':contains("' + appName + '")')
            .filter(':contains("' + status + '")')
            .within(() => {
                click(sideKebabMenu);
            });
        if (enabled) {
            cy.get(kebabActionButton).contains("Cancel").click();
        } else {
            cy.get(kebabActionButton).contains("Cancel").should("not.be.enabled");
        }
    }

    public static verifyTaskDetailsByStatus(
        appName: string,
        taskKind: TaskKind,
        taskStatus: TaskStatus = TaskStatus.succeeded
    ) {
        TaskManager.open();
        cy.get(trTag)
            .filter(':contains("' + appName + '")')
            .filter(':contains("' + taskKind + '")')
            .within(() => {
                cy.get(TaskManagerColumns.status, { timeout: 10 * MIN }).should(
                    "have.text",
                    taskStatus
                );
                cy.get(TaskManagerColumns.status).click();
                cy.get(".pf-v5-c-code-editor__code");
                // .should("contain.text", "kind: " + taskKind)
                // .should("contain.text", "state: " + taskStatus)
            });
    }
}
