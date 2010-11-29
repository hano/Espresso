// ==========================================================================
// Project:   The M-Project - Mobile HTML5 Application Framework
// Copyright: �2010 M-Way Solutions GmbH. All rights reserved.
// Creator:   alexander
// Date:      08.11.2010
// License:   Dual licensed under the MIT or GPL Version 2 licenses.
//            http://github.com/mwaylabs/The-M-Project/blob/master/MIT-LICENSE
//            http://github.com/mwaylabs/The-M-Project/blob/master/GPL-LICENSE
// ==========================================================================


var ManagedTasks

/*
 * ESPRESSO
 */
ManagedTasks = exports.ManagedTasks = {};
ManagedTasks.Tasks = new Array();

/*
 * The Tasks
 */
ManagedTasks.Tasks['dependency'] =  require('./task_dependency').Task_Dependency;
ManagedTasks.Tasks['jslint'] =  require('./task_jslint').Task_JSLINT;
ManagedTasks.Tasks['merge'] =  require('./task_merge').Task_Merge;
ManagedTasks.Tasks['void'] =  require('./task_void').Task_Void;


