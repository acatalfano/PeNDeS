class ReachCheck(PluginBase):
    def main(self):
        core = self.core
        root_node = self.root_node
        META = self.META
        active_node = self.active_node # we assume the active node is the state machine node

        visited = set()
        states = set()
        graph = {}

        # we build the most simple graph representation possible
        nodes = core.load_children(active_node)
        for node in nodes:
            if core.is_type_of(node, META['State']):
                states.add(core.get_path(node))
            if core.is_type_of(node, META['Init']):
                visited.add(core.get_path(node))
        for node in nodes:
            if core.is_type_of(node, META['Transition']):
                if core.get_pointer_path(node, 'src') in graph:
                    graph[core.get_pointer_path(node, 'src')].append(core.get_pointer_path(node, 'dst'))
                else:
                    graph[core.get_pointer_path(node, 'src')] = [core.get_pointer_path(node, 'dst')]
        
        # now we just update the visited set
        old_size = len(visited)
        new_size = 0

        while old_size != new_size:
            old_size = len(visited)
            elements = list(visited)
            for element in elements:
                if element in graph:
                    for next_state in graph[element]:
                        visited.add(next_state)
            new_size = len(visited)
        
        # now we just simply check if we have a difference between the full set of states and the reachable ones
        if len(states.difference(visited)) == 0:
            # everything is fine
            self.send_notification('Your state machine is well formed')
        else:
            # we need some states that are unreachable
            self.send_notification('Your state machine has unreachable states')
        