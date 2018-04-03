var helpers = require('helpers');
var roleUpgrader = {
    run: function(creep) {
        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
            creep.say('?? harvest');
	    }
	    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.upgrading = true;
	        creep.memory.sourceTargetId = null;
	        creep.say('? upgrade');
	    }

	    if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            if(!creep.memory.sourceTargetId) {
                var container = helpers.getClosestContainer(creep);
                if(container) {
                    creep.memory.sourceTargetId = container.id;
                }
            }
            
            if(creep.memory.sourceTargetId) {
                var container = Game.getObjectById(creep.memory.sourceTargetId);
                
                if(container) {
                    var response = creep.withdraw(container, RESOURCE_ENERGY);
                    
                    if(response == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                    } else if(response == ERR_NOT_ENOUGH_RESOURCES || container.store.energy <= 10) {
                        // Use storage if container is empty
                        if(creep.room.storage.store.energy > Memory.rooms[creep.room.name].storageMax) {
                            creep.memory.sourceTargetId = creep.room.storage.id;
                        }
                    }
                }
            }
        }
	},
};

module.exports = roleUpgrader;