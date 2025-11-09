from typing import Dict, Optional, Any
import os
import networkx as nx
import matplotlib.pyplot as plt
import json
import numpy as np

class GraphBuilder:
	def __init__(self, dataset: Optional[Dict] = None, dataset_path: Optional[str] = None):
		"""
		Initialize the GraphBuilder.
		Args:
			dataset: in-memory dataset dict with keys 'students','courses','enrollments'
			dataset_path: optional path to JSON dataset file (will be loaded)
		"""
		if dataset is None and dataset_path is None:
			raise ValueError("Either dataset or dataset_path must be provided")
		self.dataset = dataset
		self.dataset_path = dataset_path
		self.G = None

	def load_dataset_from_file(self, filepath: str) -> Dict:
		"""
		Load a JSON dataset using the project's loader if available,
		otherwise use json.load directly.
		"""
		# Avoid importing project loader to keep this module generic.
		import json

		if not os.path.exists(filepath):
			raise FileNotFoundError(f"Dataset file not found: {filepath}")
		# Try utf-8 then cp1252 for Windows-encoded files
		try:
			with open(filepath, 'r', encoding='utf-8') as f:
				return json.load(f)
		except UnicodeDecodeError:
			with open(filepath, 'r', encoding='cp1252') as f:
				return json.load(f)

	def build_graph(self, include_will_enroll: bool = True,
				 is_save_gexf: bool = True, built_graph_filepath_prefix: str = './data/built-graph') -> Any:
		"""
		Build the knowledge graph from the dataset.
        Args:
            include_will_enroll: whether to include 'will_enroll' edges in the graph
            is_save_gexf: whether to save the built graph to GEXF format
            built_graph_filepath_prefix: prefix for saving the built graph file
        The resulting graph is stored in `self.G` and also returned.
		Nodes have attributes:
		  - node_type: 'student' or 'course'
		  - orig_id: original integer id from dataset
		  - plus other domain attributes (semester, gpa, course_code, credit...)
		Edges (student -- course) have attributes:
		  - type: one of enrollment types in dataset ('liked','disliked','will_enroll')
		  - weight: numeric weight for the enrollment
		  - is_enrolled: 1 or 0
		"""
		if nx is None:
			raise RuntimeError("networkx is required for building graphs. Please install networkx")

		# ensure dataset present
		if self.dataset is None:
			if self.dataset_path:
				self.dataset = self.load_dataset_from_file(self.dataset_path)
			else:
				raise ValueError("No dataset available to build graph")

		data = self.dataset
		students = data.get('students', [])
		courses = data.get('courses', [])
		enrollments = data.get('enrollments', [])

		G = nx.Graph()

		# Add student nodes
		for s in students:
			nid = f"s_{s['student_id']}"
			attrs = {
				'node_type': 'student',
				'orig_id': s['student_id'],
				'student_code': s.get('student_code'),
				'semester': s.get('semester'),
				'gpa': s.get('gpa'),
				'student_major_code': s.get('student_major_code')
			}
			G.add_node(nid, **attrs)

		# Add course nodes
		for c in courses:
			nid = f"c_{c['course_id']}"
			attrs = {
				'node_type': 'course',
				'orig_id': c['course_id'],
				'course_code': c.get('course_code'),
				'semester': c.get('semester'),
				'credit': c.get('credit'),
				'course_major_code': c.get('course_major_code')
			}
			G.add_node(nid, **attrs)

		# Add edges for enrollments
		for e in enrollments:
			etype = e.get('type')
			if etype == 'will_enroll' and not include_will_enroll:
				continue
			sid = f"s_{e['student_id']}"
			cid = f"c_{e['course_id']}"
			weight = e.get('weight')
			# Some datasets may not include weight precomputed; attempt to infer
			if weight is None:
				weight = e.get('weight', 0.0)
			is_enrolled = 1 if etype != 'will_enroll' else 0
			edge_attrs = {'type': etype, 'weight': weight, 'is_enrolled': is_enrolled}
			# avoid duplicate edges: if multiple enrollments exist, keep list
			if G.has_edge(sid, cid):
				# store multiple interactions in a list
				existing = G[sid][cid].get('interactions', [])
				existing.append(edge_attrs)
				G[sid][cid]['interactions'] = existing
			else:
				G.add_edge(sid, cid, **edge_attrs)

		self.G = G
		if is_save_gexf:
			gexf_filepath = f"{built_graph_filepath_prefix}_{len(students)}-students_{len(courses)}-courses.gexf"
			self.save_graph_gexf(gexf_filepath)
			print(f"Graph saved to {gexf_filepath}")
		return G

	def get_subgraph_for_student(self, student_id: int, radius: int = 1):
		"""
		Return an induced subgraph around a student up to `radius` hops.
		Args:
			student_id: integer id of student
			radius: number of hops from the student node
		"""
		if self.G is None:
			raise RuntimeError("Graph is not built yet. Call build_graph() first")
		root = f"s_{student_id}"
		if root not in self.G:
			raise KeyError(f"Student node {root} not found in graph")
		nodes = {root}
		frontier = {root}
		for _ in range(radius):
			neighbors = set()
			for n in frontier:
				neighbors |= set(self.G.neighbors(n))
			frontier = neighbors - nodes
			nodes |= frontier
		return self.G.subgraph(nodes).copy()

	def get_subgraph_for_students(self, student_ids, radius: int = 1):
		"""Return an induced subgraph around multiple students up to `radius` hops.

		Args:
			student_ids: iterable of integer student ids (or node names like 's_0')
			radius: number of hops from each student node to include
		"""
		if self.G is None:
			raise RuntimeError("Graph is not built yet. Call build_graph() first")
		# normalize to node names
		seed_nodes = set()
		for sid in student_ids:
			if isinstance(sid, str) and sid.startswith('s_'):
				seed_nodes.add(sid)
			else:
				seed_nodes.add(f"s_{int(sid)}")

		nodes = set(seed_nodes)
		frontier = set(seed_nodes)
		for _ in range(radius):
			neighbors = set()
			for n in frontier:
				neighbors |= set(self.G.neighbors(n))
			frontier = neighbors - nodes
			nodes |= frontier
		return self.G.subgraph(nodes).copy()

	def visualize(self, subgraph=None, figsize=(10, 8), show_labels: bool = False, node_size: int = 200,
			is_save_img: bool = True, visualized_graph_filepath_prefix: str = './data/visualized-graph',
			seed_students: Optional[list] = None, hops: Optional[int] = None):
		"""
		Visualize the full graph or a provided subgraph.
		Args:
			subgraph: NetworkX graph to visualize. If None, visualize self.G.
			figsize: size of the matplotlib figure
            show_labels: whether to show node labels
			node_size: size of the nodes in the visualization
			is_save_img: whether to save the visualization as an image file
            visualized_graph_filepath_prefix: prefix for saving the visualized graph image file
		"""
		if nx is None or plt is None:
			raise RuntimeError("networkx and matplotlib are required for visualization")

		G = subgraph if subgraph is not None else self.G
		if G is None:
			raise RuntimeError("Graph not built. Call build_graph() or pass a subgraph")

		# Compute layout
		pos = nx.spring_layout(G, seed=42)

		# Node colors based on type
		node_colors = []
		node_sizes = []
		labels = {}
		for n, d in G.nodes(data=True):
			if d.get('node_type') == 'student':
				node_colors.append('#1f78b4')
				node_sizes.append(node_size)
				labels[n] = f"S{d.get('orig_id')}" if show_labels else ''
			else:
				node_colors.append('#33a02c')
				node_sizes.append(int(node_size * 1.2))
				labels[n] = f"C{d.get('orig_id')}" if show_labels else ''

		# Edge colors by enrollment type
		color_map = {
			'liked': '#2ca02c',      # green
			'disliked': '#d62728',   # red
			'will_enroll': '#ff7f0e',# orange
			'unknown': '#7f7f7f'     # gray
		}

		def _edge_type(u, v):
			ed = G.get_edge_data(u, v, {})
			# direct type
			if 'type' in ed and ed['type'] is not None:
				return str(ed['type'])
			# interactions list: pick most common type
			if 'interactions' in ed:
				ints = ed['interactions']
				if isinstance(ints, str):
					# sometimes interactions may be serialized; try to parse
					try:
						parsed = json.loads(ints)
						if isinstance(parsed, list) and parsed:
							first = parsed[0]
							if isinstance(first, dict) and 'type' in first:
								return str(first['type'])
					except Exception:
						pass
				if isinstance(ints, list) and ints:
					# count types
					types = [it.get('type') for it in ints if isinstance(it, dict) and 'type' in it]
					if types:
						# return most common
						return max(set(types), key=types.count)
			# fallback
			return 'unknown'

		edge_colors = []
		edge_list = []
		for u, v in G.edges():
			type_ = _edge_type(u, v)
			edge_colors.append(color_map.get(type_, color_map['unknown']))
			edge_list.append((u, v))

		# create figure and set window title to include seed students and hops when provided
		fig = plt.figure(figsize=figsize)
		# Build title string
		title_parts = []
		if seed_students:
			try:
				normalized = []
				for s in seed_students:
					if isinstance(s, str) and s.startswith('s_'):
						normalized.append(str(int(s.replace('s_', ''))))
					else:
						normalized.append(str(int(s)))
				title_parts.append('students=' + ','.join(normalized))
			except Exception:
				# fallback to string representation
				title_parts.append('students=' + str(seed_students))
		if hops is not None:
			title_parts.append(f'hops={int(hops)}')
		if title_parts:
			title = ' | '.join(title_parts)
			# attempt to set window title in a backend-safe way
			try:
				mgr = fig.canvas.manager
				mgr.set_window_title(title)
			except Exception:
				try:
					fig.canvas.set_window_title(title)
				except Exception:
					# some backends (e.g., non-GUI) do not support window titles; ignore
					pass
		nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=node_sizes)
		# draw colored edges
		nx.draw_networkx_edges(G, pos, edgelist=edge_list, edge_color=edge_colors, alpha=0.8)
		if show_labels:
			nx.draw_networkx_labels(G, pos, labels, font_size=8)

		# Legend for edge types
		from matplotlib.patches import Patch
		legend_handles = [Patch(color=color_map[k], label=k) for k in ['liked','disliked','will_enroll']]
		plt.legend(handles=legend_handles, title='Enrollment type', loc='lower left')

		# Node counts annotation (top-left)
		student_count = sum(1 for _, d in G.nodes(data=True) if d.get('node_type') == 'student')
		course_count = sum(1 for _, d in G.nodes(data=True) if d.get('node_type') == 'course')
		info_text = f"Nodes: students={student_count}, courses={course_count}"
		plt.annotate(info_text, xy=(0.01, 0.99), xycoords='figure fraction', fontsize=9, verticalalignment='top')

		# Small annotation note (bottom-left)
		plt.annotate('Edge color: liked=green, disliked=red, will_enroll=orange', xy=(0.01, 0.02), xycoords='figure fraction', fontsize=8)

		plt.axis('off')
		if is_save_img:
			img_filepath = f"{visualized_graph_filepath_prefix}_{student_count}-students_{course_count}-courses.png"
			plt.savefig(img_filepath, dpi=300)
			print(f"Graph visualization saved to {img_filepath}")
		plt.show()

	def save_graph_gexf(self, filepath: str = './data/graph.gexf'):
		"""Save built graph to GEXF format for use in graph tools (Gephi)."""
		if self.G is None:
			raise RuntimeError("Graph not built yet")
		# NetworkX GEXF writer doesn't accept numpy types (e.g. numpy.str_)
		# Convert node/edge attributes to plain Python types (and serialize
		# lists/dicts to JSON strings) before writing.
		def _sanitize(v):
			# convert numpy scalar to python scalar
			if isinstance(v, (np.generic,)):
				try:
					return v.item()
				except Exception:
					return str(v)
			# numpy arrays -> JSON string
			if isinstance(v, np.ndarray):
				return json.dumps(v.tolist(), ensure_ascii=False)
			# dict -> JSON string
			if isinstance(v, dict):
				# sanitize dict values
				return json.dumps({k: _sanitize(val) for k, val in v.items()}, ensure_ascii=False)
			# list/tuple -> JSON string
			if isinstance(v, (list, tuple)):
				return json.dumps([_sanitize(x) for x in v], ensure_ascii=False)
			# None -> empty string
			if v is None:
				return ""
			# basic python types
			if isinstance(v, (str, int, float, bool)):
				return v
			# fallback to string
			return str(v)

		H = nx.Graph()
		for n, d in self.G.nodes(data=True):
			attrs = {k: _sanitize(v) for k, v in d.items()}
			H.add_node(n, **attrs)

		for u, v, ed in self.G.edges(data=True):
			ed_attrs = {k: _sanitize(val) for k, val in ed.items()}
			H.add_edge(u, v, **ed_attrs)

		nx.write_gexf(H, filepath)

	def load_graph_gexf(self, filepath: str):
		"""Load a graph from GEXF into self.G"""
		if nx is None:
			raise RuntimeError("networkx required to load graphs")
		self.G = nx.read_gexf(filepath)
		return self.G
