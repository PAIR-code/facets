FROM jupyter/minimal-notebook

ADD . /home/jovyan/work
WORKDIR /home/jovyan/work

USER $NB_USER
RUN conda install -y pandas widgetsnbextension protobuf && \
    jupyter nbextension install facets-dist/ --user
